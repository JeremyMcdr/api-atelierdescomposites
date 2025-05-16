const express = require('express');
const dxfSequenceController = require('../controllers/dxfSequenceController');

const router = express.Router();

// Route pour convertir un DXF en séquence d'actions
router.get('/execute/:filename', dxfSequenceController.convertDxfToSequence);

// Route pour récupérer une séquence d'actions générée
router.get('/sequence/:filename', dxfSequenceController.getSequence);

module.exports = router; 