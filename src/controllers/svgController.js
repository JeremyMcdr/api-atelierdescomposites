const path = require('path');
const fs = require('fs');
const svgService = require('../services/svgService');
const apiService = require('../services/apiService');
const appConfig = require('../config/appConfig');

const uploadsDir = path.join(__dirname, '../uploads');
const sequencesDir = path.join(__dirname, '../generated_sequences');

// Assurer que le dossier de séquences existe
if (!fs.existsSync(sequencesDir)) {
  fs.mkdirSync(sequencesDir, { recursive: true });
}

// Récupérer tous les fichiers SVG
exports.getAllSVGs = (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const svgFiles = files.filter(file => path.extname(file).toLowerCase() === '.svg');
    
    const svgList = svgFiles.map(filename => {
      const stats = fs.statSync(path.join(uploadsDir, filename));
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/api/svg/${filename}`
      };
    });
    
    res.status(200).json({
      count: svgList.length,
      files: svgList
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers SVG:", error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des fichiers SVG',
      errorDetails: error.message 
    });
  }
};

exports.uploadSVG = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier SVG fourni.' });
  }
  // Le fichier est déjà sauvegardé par multer dans le dossier uploads.
  // Le nom du fichier est req.file.filename
  res.status(201).json({ 
    message: 'Fichier SVG téléversé avec succès.', 
    filename: req.file.filename 
  });
};

exports.getSVG = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json({ message: 'Fichier SVG non trouvé.' });
  }
};

// Mettre à jour un fichier SVG existant
exports.updateSVG = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier SVG fourni pour la mise à jour.' });
  }
  
  const oldFilename = req.params.filename;
  const oldFilePath = path.join(uploadsDir, oldFilename);
  
  // Vérifier que le fichier à mettre à jour existe
  if (!fs.existsSync(oldFilePath)) {
    // Supprimer le fichier téléchargé par multer car l'ancien n'existe pas
    if (req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(404).json({ message: 'Fichier SVG à mettre à jour non trouvé.' });
  }
  
  try {
    // Supprimer l'ancien fichier
    fs.unlinkSync(oldFilePath);
    
    // Renommer le nouveau fichier pour qu'il ait le même nom que l'ancien
    fs.renameSync(req.file.path, oldFilePath);
    
    res.status(200).json({
      message: 'Fichier SVG mis à jour avec succès.',
      filename: oldFilename
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du fichier SVG:", error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du fichier SVG.',
      errorDetails: error.message
    });
  }
};

// Supprimer un fichier SVG
exports.deleteSVG = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Fichier SVG non trouvé.' });
  }
  
  try {
    fs.unlinkSync(filePath);
    res.status(200).json({
      message: 'Fichier SVG supprimé avec succès.',
      deletedFile: filename
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier SVG:", error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du fichier SVG.',
      errorDetails: error.message
    });
  }
};

exports.executeSVG = async (req, res) => {
  const originalSvgFilename = req.params.filename;
  const svgFilePath = path.join(uploadsDir, originalSvgFilename);

  if (!fs.existsSync(svgFilePath)) {
    return res.status(404).json({ message: 'Fichier SVG non trouvé pour exécution.' });
  }

  // Obtenir les options depuis la requête
  const sendToApi = req.query.sendToApi === 'true' || req.query.sendToApi === true || appConfig.ENABLE_AUTO_API_SEND;
  const apiUrl = req.query.apiUrl || appConfig.TARGET_API_URL;

  try {
    const svgContent = fs.readFileSync(svgFilePath, 'utf-8');
    const actions = await svgService.transformSVGToActions(svgContent);
    
    // Envoyer à l'API externe si demandé
    let apiResponse = null;
    let apiSent = false;
    
    if (sendToApi && apiUrl) {
      try {
        console.log(`Envoi des actions à l'API externe: ${apiUrl}`);
        apiResponse = await apiService.sendActionsToApi(actions, apiUrl, {
          timeout: appConfig.API_REQUEST_TIMEOUT
        });
        apiSent = true;
        console.log('Actions envoyées avec succès à l\'API externe');
      } catch (apiError) {
        console.error('Erreur lors de l\'envoi à l\'API externe:', apiError.message);
        // Ne pas interrompre le traitement en cas d'échec d'envoi API
      }
    }
    
    // Sauvegarder les actions dans un fichier JSON
    const sequenceFilename = `${path.parse(originalSvgFilename).name}_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    let responsePayload;

    try {
      fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
      console.log(`Séquence d'actions sauvegardée dans : ${sequenceFilePath}`);
      
      // Construction de la réponse
      let message = `Séquence d'actions générée et sauvegardée pour ${originalSvgFilename}`;
      if (apiSent) {
        message += ` et envoyée à l'API externe`;
      } else if (sendToApi) {
        message += `. L'envoi à l'API externe a échoué.`;
      }
      
      responsePayload = {
        message: message,
        originalSvg: originalSvgFilename,
        sequenceFile: sequenceFilename,
        sequenceFileLocation: sequenceFilePath,
        actions: actions,
        apiSent: apiSent
      };
      
      if (apiSent) {
        responsePayload.apiResponse = apiResponse;
      }
      
      res.status(200).json(responsePayload);

    } catch (writeError) {
      console.error("Erreur lors de la sauvegarde de la séquence d'actions:", writeError);
      responsePayload = {
        message: 'Erreur lors de la sauvegarde de la séquence d\'actions. La transformation a réussi mais la sauvegarde a échoué.',
        originalSvg: originalSvgFilename,
        actions: actions,
        apiSent: apiSent,
        apiResponse: apiSent ? apiResponse : null,
        errorDetails: writeError.message
      };
      res.status(500).json(responsePayload);
    }

  } catch (error) {
    console.error("Erreur lors de la transformation SVG:", error);
    res.status(500).json({ 
      message: 'Erreur lors de la transformation du SVG.', 
      errorDetails: error.message 
    });
  }
}; 