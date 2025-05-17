const express = require('express');
const testController = require('../controllers/testController');

const router = express.Router();

// Route de test pour l'action AVANCER
router.get('/forward', testController.testForward);

// Route de test pour tracer un carré avec des rotations de 90°
router.get('/square', testController.testSquare);

// Route de test pour tracer un rectangle avec des rotations de 90°
router.get('/rectangle', testController.testRectangle);

// Route de test pour tracer un polygone régulier avec des rotations relatives
router.get('/polygon', testController.testPolygon);

module.exports = router; 