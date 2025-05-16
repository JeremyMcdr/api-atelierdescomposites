const express = require('express');
const router = express.Router();
const { triggerEmergencyStop } = require('../services/emergencyStopService');

/**
 * @swagger
 * /api/emergency/stop:
 *   post:
 *     summary: Déclenche un arrêt d'urgence sur l'API cible
 *     description: Envoie une commande d'arrêt d'urgence à l'API cible pour stopper immédiatement les machines
 *     tags:
 *       - Emergency
 *     responses:
 *       200:
 *         description: Arrêt d'urgence déclenché avec succès
 *       500:
 *         description: Erreur lors du déclenchement de l'arrêt d'urgence
 */
router.post('/stop', async (req, res) => {
  try {
    const result = await triggerEmergencyStop();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Arrêt d\'urgence déclenché avec succès',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erreur lors de la gestion de la demande d\'arrêt d\'urgence:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du traitement de la demande d\'arrêt d\'urgence',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/emergency/status:
 *   get:
 *     summary: Vérifie le statut de connexion avec l'API cible
 *     description: Vérifie si l'API cible est accessible et opérationnelle
 *     tags:
 *       - Emergency
 *     responses:
 *       200:
 *         description: Statut de connexion avec l'API cible
 */
router.get('/status', async (req, res) => {
  try {
    // Importer le service de vérification de santé
    const { checkTargetApiHealth } = require('../services/healthCheckService');
    const healthStatus = await checkTargetApiHealth();
    
    return res.status(200).json({
      ...healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de l\'API cible:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut de l\'API cible',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 