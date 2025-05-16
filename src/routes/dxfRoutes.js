const express = require('express');
const dxfController = require('../controllers/dxfController');

const router = express.Router();

// Route pour convertir un SVG en DXF
router.get('/convert/:filename', dxfController.convertToDXF);

// Route pour récupérer un fichier DXF généré
router.get('/download/:filename', dxfController.getDXF);

module.exports = router; 