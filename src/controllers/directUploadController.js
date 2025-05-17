const path = require('path');
const fs = require('fs');
const combinedService = require('../services/combinedService');
const appConfig = require('../config/appConfig');
const dxfParserService = require('../services/dxfParserService');

const uploadsDir = path.join(__dirname, '../uploads');
const dxfDir = path.join(__dirname, '../generated_dxf');
const sequencesDir = path.join(__dirname, '../generated_sequences');

// Assurer que les dossiers existent
if (!fs.existsSync(sequencesDir)) {
  fs.mkdirSync(sequencesDir, { recursive: true });
}
if (!fs.existsSync(dxfDir)) {
  fs.mkdirSync(dxfDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Gère l'upload d'un SVG et sa conversion directe en séquence d'actions
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.uploadAndConvert = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Aucun fichier SVG fourni.'
    });
  }

  // Le fichier est déjà sauvegardé par multer dans le dossier uploads
  const svgFilePath = req.file.path;
  const originalFilename = req.file.originalname;
  
  // Obtenir les options depuis la requête
  const options = {
    sendToApi: req.body.sendToApi === 'true' || req.body.sendToApi === true,
    apiUrl: req.body.apiUrl || appConfig.TARGET_API_URL,
    closePolygons: !(req.body.closePolygons === 'false' || req.body.closePolygons === false),
    ignoreAngleChecks: req.body.ignoreAngleChecks === 'true'
  };
  
  console.log(`Options pour la conversion: ${JSON.stringify(options)}`);
  
  try {
    // Générer directement la séquence d'actions à partir du fichier SVG uploadé
    const result = await combinedService.convertSVGToActions(svgFilePath, dxfDir, options);
    
    // Vérifier si le résultat contient des erreurs d'angle
    if (!result.success) {
      console.warn(`Erreur de génération pour ${originalFilename}: ${result.error}`);
      return res.status(422).json({
        success: false,
        message: result.error,
        invalidAngles: result.invalidAngles,
        maxAllowedAngle: dxfParserService.MAX_BEND_ANGLE,
        originalSvg: req.file.filename,
        originalFilename: originalFilename
      });
    }
    
    const { actions, apiSent, pieceId } = result;
    
    // Sauvegarder les actions dans un fichier JSON
    const sequenceFilename = `${path.parse(originalFilename).name}_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    
    try {
      // Écrire le fichier de séquence
      fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
      console.log(`Séquence d'actions sauvegardée dans : ${sequenceFilePath}`);
      
      // Revenir au format JSON original pour la compatibilité avec le frontend
      const response = {
        success: true,
        message: `Séquence d'actions générée directement depuis l'upload SVG et sauvegardée`,
        originalSvg: req.file.filename,
        originalFilename: originalFilename,
        sequenceFile: sequenceFilename,
        sequenceFileLocation: sequenceFilePath,
        actions: actions,
        apiSent: apiSent
      };
      
      // Ajouter des informations sur l'envoi à l'API et la production
      if (apiSent && pieceId) {
        response.message += ` et envoyée pour production`;
        response.pieceId = pieceId;
        response.productionStatus = 'ENVOYE';
        response.productionMessage = 'La pièce a été envoyée à la machine et est en cours de traitement';
      }
      
      res.status(200).json(response);
    } catch (writeError) {
      console.error("Erreur lors de la sauvegarde de la séquence d'actions:", writeError);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la sauvegarde de la séquence d'actions. La génération a réussi mais la sauvegarde a échoué.",
        originalSvg: req.file.filename,
        originalFilename: originalFilename,
        actions: actions,
        errorDetails: writeError.message
      });
    }
  } catch (error) {
    console.error("Erreur lors de la conversion SVG vers séquence d'actions:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la conversion SVG vers séquence d'actions.", 
      errorDetails: error.message 
    });
  }
}; 