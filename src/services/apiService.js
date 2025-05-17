const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Stockage des statuts de production
const productionStatus = new Map();
const productionLogPath = path.join(__dirname, '../logs/production_status.json');

// Assurer que le dossier de logs existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Charger les statuts existants au démarrage
try {
  if (fs.existsSync(productionLogPath)) {
    const data = JSON.parse(fs.readFileSync(productionLogPath, 'utf8'));
    for (const [id, status] of Object.entries(data)) {
      productionStatus.set(id, status);
    }
    console.log(`Chargement de ${productionStatus.size} statuts de production`);
  }
} catch (error) {
  console.error("Erreur lors du chargement des statuts de production:", error.message);
}

// Sauvegarder les statuts de production
const saveProductionStatus = () => {
  try {
    const data = {};
    for (const [id, status] of productionStatus.entries()) {
      data[id] = status;
    }
    fs.writeFileSync(productionLogPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des statuts de production:", error.message);
  }
};

/**
 * Envoie une séquence d'actions à une API externe
 * @param {Array} actions - Tableau d'actions à envoyer
 * @param {string} targetApiUrl - URL de l'API cible
 * @param {Object} options - Options supplémentaires pour la requête
 * @param {string} options.pieceId - Identifiant unique de la pièce
 * @returns {Promise<Object>} - Réponse de l'API
 */
async function sendActionsToApi(actions, targetApiUrl, options = {}) {
  if (!targetApiUrl) {
    throw new Error('URL de l\'API cible non spécifiée');
  }

  const pieceId = options.pieceId || `piece_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Enregistrer l'état initial
  productionStatus.set(pieceId, {
    status: 'ENVOYE',
    timestamp: Date.now(),
    actions: actions.length,
    targetApi: targetApiUrl,
    confirmed: false,
    error: null
  });
  saveProductionStatus();

  try {
    const response = await axios.post(targetApiUrl, actions, {
      headers: {
        'Content-Type': 'application/json',
        'X-Piece-ID': pieceId,
        ...options.headers
      },
      timeout: options.timeout || 1000000,
      ...options
    });
    
    console.log(`Réponse de l'API reçue avec statut ${response.status}`);
    
    // Mettre à jour le statut avec la confirmation
    productionStatus.set(pieceId, {
      ...productionStatus.get(pieceId),
      status: 'CONFIRME',
      confirmed: true,
      confirmedAt: Date.now(),
      apiResponse: response.data
    });
    saveProductionStatus();
    
    console.log(`Production confirmée pour la pièce ${pieceId}`);
    return {
      ...response.data,
      pieceId,
      confirmed: true
    };
  } catch (error) {
    console.error('----------------------------------------');
    console.error(`ERREUR LORS DE L'ENVOI À L'API: ${targetApiUrl}`);
    console.error(`Message d'erreur: ${error.message}`);
    
    // Mettre à jour le statut avec l'erreur
    productionStatus.set(pieceId, {
      ...productionStatus.get(pieceId),
      status: 'ERREUR',
      error: error.message,
      errorAt: Date.now()
    });
    saveProductionStatus();
    
    if (error.response) {
      console.error(`Statut: ${error.response.status}`);
      console.error(`Données: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('Aucune réponse reçue du serveur. Vérifiez que le serveur est accessible.');
      console.error(`Détails de la requête: ${JSON.stringify(error.request._currentUrl || error.request.path)}`);
    }
    console.error('----------------------------------------');
    throw error;
  }
}

/**
 * Récupère le statut de production d'une pièce
 * @param {string} pieceId - Identifiant de la pièce
 * @returns {Object} Statut de la production
 */
function getProductionStatus(pieceId) {
  if (productionStatus.has(pieceId)) {
    return productionStatus.get(pieceId);
  }
  return { status: 'NON_TROUVE', pieceId };
}

/**
 * Récupère tous les statuts de production
 * @param {number} limit - Nombre maximum de statuts à retourner (les plus récents)
 * @returns {Array} Liste des statuts de production
 */
function getAllProductionStatus(limit = 100) {
  const statuses = Array.from(productionStatus.entries())
    .map(([id, status]) => ({ id, ...status }))
    .sort((a, b) => b.timestamp - a.timestamp);
  
  return limit ? statuses.slice(0, limit) : statuses;
}

module.exports = {
  sendActionsToApi,
  getProductionStatus,
  getAllProductionStatus
}; 