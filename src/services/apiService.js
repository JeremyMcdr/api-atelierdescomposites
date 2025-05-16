const axios = require('axios');

/**
 * Envoie une séquence d'actions à une API externe
 * @param {Array} actions - Tableau d'actions à envoyer
 * @param {string} targetApiUrl - URL de l'API cible
 * @param {Object} options - Options supplémentaires pour la requête
 * @returns {Promise<Object>} - Réponse de l'API
 */
async function sendActionsToApi(actions, targetApiUrl, options = {}) {
  if (!targetApiUrl) {
    throw new Error('URL de l\'API cible non spécifiée');
  }

  try {
    console.log(`Envoi de ${actions.length} actions à l'API: ${targetApiUrl}`);
    
    const response = await axios.post(targetApiUrl, actions, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 10000,
      ...options
    });
    
    console.log(`Réponse de l'API reçue avec statut ${response.status}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi des actions à l\'API:', error.message);
    if (error.response) {
      console.error(`Statut: ${error.response.status}, Données: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

module.exports = {
  sendActionsToApi
}; 