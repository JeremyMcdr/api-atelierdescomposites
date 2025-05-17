const apiService = require('../services/apiService');
const fs = require('fs');
const path = require('path');
const appConfig = require('../config/appConfig');

const sequencesDir = path.join(__dirname, '../generated_sequences');

/**
 * Génère une action AVANCER simple et l'envoie à l'API cible
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
exports.testForward = async (req, res) => {
  try {
    // Récupérer la distance à avancer depuis la requête ou utiliser une valeur par défaut
    const distance = req.query.distance ? parseFloat(req.query.distance) : 100;
    
    // Créer la séquence d'actions avec une seule action AVANCER
    const actions = [
      {
        action: 'AVANCER',
        valeur: distance
      },
      {
        action: 'COUPER'
      }
    ];
    
    // Préparer l'URL de l'API cible
    const apiUrl = req.query.apiUrl || appConfig.TARGET_API_URL;
    
    // Enregistrer la séquence dans un fichier
    const sequenceFilename = `test_forward_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
    
    console.log(`Séquence de test créée: ${sequenceFilename}`);
    console.log(`Envoi de la séquence à l'API: ${apiUrl}`);
    
    // Envoyer à l'API cible
    try {
      const apiResponse = await apiService.sendActionsToApi(actions, apiUrl, {
        timeout: appConfig.API_REQUEST_TIMEOUT
      });
      
      // Répondre avec succès
      res.status(200).json({
        message: 'Test d\'avancement exécuté avec succès',
        sequenceFile: sequenceFilename,
        actions: actions,
        apiResponse: apiResponse
      });
    } catch (apiError) {
      res.status(500).json({
        message: 'Erreur lors de l\'envoi à l\'API',
        sequenceFile: sequenceFilename,
        actions: actions,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error("Erreur lors du test d'avancement:", error);
    res.status(500).json({
      message: 'Erreur lors du test d\'avancement',
      error: error.message
    });
  }
};

/**
 * Génère une séquence pour tracer un carré avec des rotations de 90 degrés
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
exports.testSquare = async (req, res) => {
  try {
    // Récupérer la taille du côté depuis la requête ou utiliser une valeur par défaut
    const sideLength = req.query.size ? parseFloat(req.query.size) : 100;
    
    // Créer la séquence d'actions pour un carré
    // Les rotations sont de 90° (relatives) pour chaque coin du carré
    const actions = [
      // Premier côté
      { action: 'AVANCER', valeur: sideLength },
      
      // Tourner à droite de 90° (relatif)
      { action: 'PLIER', valeur: 90 },
      { action: 'AVANCER', valeur: sideLength },
      
      // Tourner à droite de 90° (relatif)
      { action: 'PLIER', valeur: 90 },
      { action: 'AVANCER', valeur: sideLength },
      
      // Tourner à droite de 90° (relatif)
      { action: 'PLIER', valeur: 90 },
      { action: 'AVANCER', valeur: sideLength },
      
      // Couper à la fin
      { action: 'COUPER' }
    ];
    
    // Préparer l'URL de l'API cible
    const apiUrl = req.query.apiUrl || appConfig.TARGET_API_URL;
    
    // Enregistrer la séquence dans un fichier
    const sequenceFilename = `test_square_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
    
    console.log(`Séquence de carré créée: ${sequenceFilename}`);
    console.log(`Envoi de la séquence à l'API: ${apiUrl}`);
    
    // Envoyer à l'API cible
    try {
      const apiResponse = await apiService.sendActionsToApi(actions, apiUrl, {
        timeout: appConfig.API_REQUEST_TIMEOUT
      });
      
      // Répondre avec succès
      res.status(200).json({
        message: 'Test de carré exécuté avec succès',
        sequenceFile: sequenceFilename,
        actions: actions,
        apiResponse: apiResponse
      });
    } catch (apiError) {
      res.status(500).json({
        message: 'Erreur lors de l\'envoi à l\'API',
        sequenceFile: sequenceFilename,
        actions: actions,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error("Erreur lors du test de carré:", error);
    res.status(500).json({
      message: 'Erreur lors du test de carré',
      error: error.message
    });
  }
};

/**
 * Génère une séquence pour tracer un rectangle avec des rotations de 90 degrés
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
exports.testRectangle = async (req, res) => {
  try {
    // Récupérer les dimensions depuis la requête ou utiliser des valeurs par défaut
    const width = req.query.width ? parseFloat(req.query.width) : 100;
    const height = req.query.height ? parseFloat(req.query.height) : 50;
    
    // Créer la séquence d'actions pour un rectangle
    // Les rotations sont de 90° (relatives) pour chaque coin du rectangle
    const actions = [
      // Premier côté (largeur)
      { action: 'AVANCER', valeur: width },
      
      // Tourner à droite de 90° (relatif)
      { action: 'PLIER', valeur: 90 },
      { action: 'AVANCER', valeur: height },
      
      // Tourner à droite de 90° (relatif)
      { action: 'PLIER', valeur: 90 },
      { action: 'AVANCER', valeur: width },
      
      // Tourner à droite de 90° (relatif)
      { action: 'PLIER', valeur: 90 },
      { action: 'AVANCER', valeur: height },
      
      // Couper à la fin
      { action: 'COUPER' }
    ];
    
    // Préparer l'URL de l'API cible
    const apiUrl = req.query.apiUrl || appConfig.TARGET_API_URL;
    
    // Enregistrer la séquence dans un fichier
    const sequenceFilename = `test_rectangle_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
    
    console.log(`Séquence de rectangle créée: ${sequenceFilename}`);
    console.log(`Envoi de la séquence à l'API: ${apiUrl}`);
    
    // Envoyer à l'API cible
    try {
      const apiResponse = await apiService.sendActionsToApi(actions, apiUrl, {
        timeout: appConfig.API_REQUEST_TIMEOUT
      });
      
      // Répondre avec succès
      res.status(200).json({
        message: 'Test de rectangle exécuté avec succès',
        sequenceFile: sequenceFilename,
        actions: actions,
        apiResponse: apiResponse
      });
    } catch (apiError) {
      res.status(500).json({
        message: 'Erreur lors de l\'envoi à l\'API',
        sequenceFile: sequenceFilename,
        actions: actions,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error("Erreur lors du test de rectangle:", error);
    res.status(500).json({
      message: 'Erreur lors du test de rectangle',
      error: error.message
    });
  }
};

/**
 * Génère une séquence pour tracer un polygone régulier avec des rotations relatives
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
exports.testPolygon = async (req, res) => {
  try {
    // Récupérer les paramètres depuis la requête ou utiliser des valeurs par défaut
    const sides = req.query.sides ? parseInt(req.query.sides) : 4;
    const sideLength = req.query.size ? parseFloat(req.query.size) : 100;
    
    // Calculer l'angle externe du polygone régulier
    // Pour un carré: 360° ÷ 4 = 90°
    // Pour un triangle: 360° ÷ 3 = 120°
    // Pour un pentagone: 360° ÷ 5 = 72°
    const externalAngle = 360 / sides;
    
    // Créer la séquence d'actions pour le polygone
    const actions = [];
    
    // Tracer chaque côté avec une rotation relative entre chacun
    for (let i = 0; i < sides; i++) {
      // Avancer le long du côté
      actions.push({ action: 'AVANCER', valeur: sideLength });
      
      // Si ce n'est pas le dernier côté, ajouter une rotation
      if (i < sides - 1) {
        actions.push({ action: 'PLIER', valeur: externalAngle });
      }
    }
    
    // Ajouter l'action COUPER à la fin
    actions.push({ action: 'COUPER' });
    
    // Préparer l'URL de l'API cible
    const apiUrl = req.query.apiUrl || appConfig.TARGET_API_URL;
    
    // Enregistrer la séquence dans un fichier
    const sequenceFilename = `test_polygon_${sides}_${Date.now()}.json`;
    const sequenceFilePath = path.join(sequencesDir, sequenceFilename);
    fs.writeFileSync(sequenceFilePath, JSON.stringify(actions, null, 2));
    
    console.log(`Séquence de polygone à ${sides} côtés créée: ${sequenceFilename}`);
    console.log(`Envoi de la séquence à l'API: ${apiUrl}`);
    
    // Envoyer à l'API cible
    try {
      const apiResponse = await apiService.sendActionsToApi(actions, apiUrl, {
        timeout: appConfig.API_REQUEST_TIMEOUT
      });
      
      // Répondre avec succès
      res.status(200).json({
        message: `Test de polygone à ${sides} côtés exécuté avec succès`,
        sequenceFile: sequenceFilename,
        actions: actions,
        apiResponse: apiResponse
      });
    } catch (apiError) {
      res.status(500).json({
        message: 'Erreur lors de l\'envoi à l\'API',
        sequenceFile: sequenceFilename,
        actions: actions,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error("Erreur lors du test de polygone:", error);
    res.status(500).json({
      message: 'Erreur lors du test de polygone',
      error: error.message
    });
  }
}; 