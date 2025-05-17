const express = require('express');
const statusController = require('../controllers/statusController');

const router = express.Router();

// Route pour récupérer le statut d'une pièce spécifique
router.get('/production/:pieceId', statusController.getProductionStatus);

// Route pour récupérer tous les statuts de production
router.get('/production', statusController.getAllProductionStatus);

module.exports = router; 