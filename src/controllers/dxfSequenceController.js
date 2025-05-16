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
  
  if (!fs.existsSync(dxfFilePath)) {
    return res.status(404).json({ message: 'Fichier DXF non trouvé.' });
  }
  
  try {
    // Générer la séquence d'actions à partir du fichier DXF
    const actions = await dxfParserService.parseDxfToActions(dxfFilePath);
    
    // Sauvegarder les actions dans un fichier JSON
    const sequenceFilename = `${path.parse(filename).name}_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    
    try {
      fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
      console.log(`Séquence d'actions sauvegardée dans : ${sequenceFilePath}`);
      
      res.status(200).json({
        message: `Séquence d'actions générée et sauvegardée pour ${filename}`,
        originalDxf: filename,
        sequenceFile: sequenceFilename,
        sequenceFileLocation: sequenceFilePath,
        actions: actions
      });
    } catch (writeError) {
      console.error("Erreur lors de la sauvegarde de la séquence d'actions:", writeError);
      res.status(500).json({
        message: "Erreur lors de la sauvegarde de la séquence d'actions. La génération a réussi mais la sauvegarde a échoué.",
        originalDxf: filename,
        actions: actions,
        errorDetails: writeError.message
      });
    }
  } catch (error) {
    console.error("Erreur lors de la conversion DXF vers séquence d'actions:", error);
    res.status(500).json({ 
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
    res.status(404).json({ message: 'Fichier de séquence non trouvé.' });
  }
}; 