const express = require('express');
const svgController = require('../controllers/svgController');
const upload = require('../middlewares/uploadMiddleware'); // Nous allons créer ce middleware pour multer

const router = express.Router();

// Toutes les routes SVG nécessiteront une authentification
// router.use(authMiddleware.verifyToken);

// Récupérer tous les fichiers SVG
router.get('/', svgController.getAllSVGs);

// Téléverser un nouveau fichier SVG
router.post('/upload', upload.single('svgfile'), svgController.uploadSVG);

// Récupérer un fichier SVG spécifique
router.get('/:filename', svgController.getSVG);

// Mettre à jour un fichier SVG existant
router.put('/:filename', upload.single('svgfile'), svgController.updateSVG);

// Supprimer un fichier SVG
router.delete('/:filename', svgController.deleteSVG);

// Exécuter un SVG (convertir en séquence d'actions)
router.post('/execute/:filename', svgController.executeSVG);

module.exports = router; 