const express = require('express');
const svgLibraryController = require('../controllers/svgLibraryController');

const router = express.Router();

// Route pour sauvegarder une pièce SVG
router.post('/pieces', svgLibraryController.savePiece);

// Route pour récupérer toutes les pièces SVG
router.get('/pieces', svgLibraryController.getAllPieces);

// Route pour récupérer le contenu d'une pièce SVG spécifique
router.get('/pieces/:pieceId', svgLibraryController.getPieceContent);

// Route pour supprimer une pièce SVG
router.delete('/pieces/:pieceId', svgLibraryController.deletePiece);

module.exports = router; 