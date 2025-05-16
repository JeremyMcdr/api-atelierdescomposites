const path = require('path');
const fs = require('fs');
const combinedService = require('../services/combinedService');
const appConfig = require('../config/appConfig');

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

/**
 * Convertit directement un fichier SVG en séquence d'actions
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.convertSVGtoSequence = async (req, res) => {
  const filename = req.params.filename;
  const svgFilePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(svgFilePath)) {
    return res.status(404).json({ message: 'Fichier SVG non trouvé.' });
  }
  
  // Obtenir les options depuis la requête
  const options = {
    sendToApi: req.query.sendToApi === 'true' || req.query.sendToApi === true,
    apiUrl: req.query.apiUrl || appConfig.TARGET_API_URL,
    closePolygons: !(req.query.closePolygons === 'false' || req.query.closePolygons === false)
  };
  
  console.log(`Options pour la conversion: ${JSON.stringify(options)}`);
  
  try {
    // Générer directement la séquence d'actions à partir du fichier SVG
    const result = await combinedService.convertSVGToActions(svgFilePath, dxfDir, options);
    const { actions, apiResponse, apiSent } = result;
    
    // Sauvegarder les actions dans un fichier JSON
    const sequenceFilename = `${path.parse(filename).name}_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    
    try {
      fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
      console.log(`Séquence d'actions sauvegardée dans : ${sequenceFilePath}`);
      
      // Construire la réponse
      const response = {
        message: `Séquence d'actions générée directement du SVG et sauvegardée pour ${filename}`,
        originalSvg: filename,
        sequenceFile: sequenceFilename,
        sequenceFileLocation: sequenceFilePath,
        actions: actions,
        apiSent: apiSent
      };
      
      // Ajouter les informations de l'API si disponibles
      if (apiSent) {
        response.apiResponse = apiResponse;
        response.message += ` et envoyée à l'API externe`;
      } else if (options.sendToApi) {
        response.message += `. L'envoi à l'API externe a échoué.`;
      }
      
      res.status(200).json(response);
    } catch (writeError) {
      console.error("Erreur lors de la sauvegarde de la séquence d'actions:", writeError);
      res.status(500).json({
        message: "Erreur lors de la sauvegarde de la séquence d'actions. La génération a réussi mais la sauvegarde a échoué.",
        originalSvg: filename,
        actions: actions,
        apiSent: apiSent,
        apiResponse: apiSent ? apiResponse : null,
        errorDetails: writeError.message
      });
    }
  } catch (error) {
    console.error("Erreur lors de la conversion SVG vers séquence d'actions:", error);
    res.status(500).json({ 
      message: "Erreur lors de la conversion SVG vers séquence d'actions.", 
      errorDetails: error.message 
    });
  }
}; 