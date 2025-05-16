const path = require('path');
const fs = require('fs');
const dxfService = require('../services/dxfService');

const uploadsDir = path.join(__dirname, '../uploads');
const outputDir = path.join(__dirname, '../generated_dxf');

// Assurer que le dossier de sortie existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Convertit un fichier SVG en DXF
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.convertToDXF = async (req, res) => {
  const filename = req.params.filename;
  const svgFilePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(svgFilePath)) {
    return res.status(404).json({ message: 'Fichier SVG non trouvé.' });
  }
  
  try {
    const dxfFilePath = await dxfService.convertSVGToDXF(svgFilePath, outputDir);
    
    const dxfFilename = path.basename(dxfFilePath);
    
    res.status(200).json({
      message: 'Conversion réussie.',
      originalSvg: filename,
      dxfFile: dxfFilename,
      dxfFileLocation: dxfFilePath
    });
    
  } catch (error) {
    console.error("Erreur lors de la conversion SVG vers DXF:", error);
    res.status(500).json({ 
      message: 'Erreur lors de la conversion SVG vers DXF.', 
      errorDetails: error.message 
    });
  }
};

/**
 * Récupère un fichier DXF généré
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getDXF = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json({ message: 'Fichier DXF non trouvé.' });
  }
}; 