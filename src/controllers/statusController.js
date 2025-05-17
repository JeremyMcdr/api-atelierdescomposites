const apiService = require('../services/apiService');

/**
 * Récupère le statut de production d'une pièce spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getProductionStatus = (req, res) => {
  const pieceId = req.params.pieceId;
  
  if (!pieceId) {
    return res.status(400).json({
      success: false,
      message: 'Identifiant de pièce manquant'
    });
  }
  
  const status = apiService.getProductionStatus(pieceId);
  
  if (status.status === 'NON_TROUVE') {
    return res.status(404).json({
      success: false,
      message: `Aucune pièce trouvée avec l'identifiant ${pieceId}`,
      pieceId
    });
  }
  
  // Formatage de la réponse pour le client
  const response = {
    success: true,
    pieceId,
    status: status.status,
    timestamp: status.timestamp,
    message: getStatusMessage(status.status),
    details: status
  };
  
  res.status(200).json(response);
};

/**
 * Récupère le statut de toutes les pièces en production
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getAllProductionStatus = (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
  const statuses = apiService.getAllProductionStatus(limit);
  
  res.status(200).json({
    success: true,
    count: statuses.length,
    statuses: statuses.map(status => ({
      pieceId: status.id,
      status: status.status,
      timestamp: status.timestamp,
      message: getStatusMessage(status.status)
    })),
    details: statuses
  });
};

/**
 * Retourne un message explicatif pour chaque statut
 * @param {string} status - Code de statut
 * @returns {string} - Message explicatif
 */
function getStatusMessage(status) {
  switch (status) {
    case 'ENVOYE':
      return 'La pièce a été envoyée à la machine et est en attente de confirmation';
    case 'CONFIRME':
      return 'La production de la pièce a été confirmée par la machine';
    case 'ERREUR':
      return 'Une erreur est survenue lors de l\'envoi à la machine';
    case 'TERMINE':
      return 'La production de la pièce est terminée';
    case 'ANNULE':
      return 'La production de la pièce a été annulée';
    default:
      return 'Statut inconnu';
  }
} 