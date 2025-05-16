const express = require('express');
const combinedController = require('../controllers/combinedController');

const router = express.Router();

// Route pour convertir directement un SVG en séquence d'actions
router.get('/svg-to-sequence/:filename', combinedController.convertSVGtoSequence);

module.exports = router; 