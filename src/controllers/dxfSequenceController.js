const path = require('path');
const fs = require('fs');
const dxfParserService = require('../services/dxfParserService');

const dxfDir = path.join(__dirname, '../generated_dxf');
const sequencesDir = path.join(__dirname, '../generated_sequences');

// Assurer que les dossiers existent
if (!fs.existsSync(sequencesDir)) {
  fs.mkdirSync(sequencesDir, { recursive: true });
}

/**
 * Convertit un fichier DXF en séquence d'actions
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.convertDxfToSequence = async (req, res) => {
  const filename = req.params.filename;
  const dxfFilePath = path.join(dxfDir, filename);
  
  // Options de conversion (depuis query params)
  const closePolygons = req.query.closePolygons !== 'false'; // Par défaut à true
  const startAtLongestSegment = req.query.startAtLongestSegment !== 'false'; // Par défaut à true
  const ignoreAngleChecks = req.query.ignoreAngleChecks === 'true'; // Par défaut à false
  
  if (!fs.existsSync(dxfFilePath)) {
    return res.status(404).json({ 
      success: false,
      message: 'Fichier DXF non trouvé.' 
    });
  }
  
  try {
    // Générer la séquence d'actions à partir du fichier DXF
    const result = await dxfParserService.parseDxfToActions(dxfFilePath, {
      closePolygons,
      startAtLongestSegment,
      ignoreAngleChecks
    });
    
    // Vérifier si le résultat contient des erreurs d'angle
    if (!result.success) {
      console.warn(`Erreur de génération pour ${filename}: ${result.error}`);
      return res.status(422).json({
        success: false,
        message: result.error,
        invalidAngles: result.invalidAngles,
        maxAllowedAngle: dxfParserService.MAX_BEND_ANGLE
      });
    }
    
    // Récupérer les actions du résultat
    const actions = result.actions;
    
    // Sauvegarder les actions dans un fichier JSON
    const sequenceFilename = `${path.parse(filename).name}_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    
    try {
      fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
      console.log(`Séquence d'actions sauvegardée dans : ${sequenceFilePath}`);
      
      res.status(200).json({
        success: true,
        message: `Séquence d'actions générée et sauvegardée pour ${filename}`,
        originalDxf: filename,
        sequenceFile: sequenceFilename,
        sequenceFileLocation: sequenceFilePath,
        actions: actions
      });
    } catch (writeError) {
      console.error("Erreur lors de la sauvegarde de la séquence d'actions:", writeError);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la sauvegarde de la séquence d'actions. La génération a réussi mais la sauvegarde a échoué.",
        originalDxf: filename,
        actions: actions,
        errorDetails: writeError.message
      });
    }
  } catch (error) {
    console.error("Erreur lors de la conversion DXF vers séquence d'actions:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la conversion DXF vers séquence d'actions.", 
      errorDetails: error.message 
    });
  }
};

/**
 * Récupère une séquence d'actions générée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getSequence = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(sequencesDir, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json({ 
      success: false,
      message: 'Fichier de séquence non trouvé.' 
    });
  }
}; 