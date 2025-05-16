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
    // Logs détaillés pour le débogage
    console.log('----------------------------------------');
    console.log(`ENVOI DE DONNÉES À L'API EXTERNE`);
    console.log(`URL COMPLÈTE: ${targetApiUrl}`);
    console.log(`ADRESSE IP/HÔTE: ${new URL(targetApiUrl).hostname}`);
    console.log(`CHEMIN: ${new URL(targetApiUrl).pathname}`);
    console.log(`NOMBRE D'ACTIONS: ${actions.length}`);
    console.log(`PREMIÈRE ACTION: ${JSON.stringify(actions[0])}`);
    console.log(`DERNIÈRE ACTION: ${JSON.stringify(actions[actions.length - 1])}`);
    console.log('----------------------------------------');
    
    const response = await axios.post(targetApiUrl, actions, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 10000,
      ...options
    });
    
    console.log(`Réponse de l'API reçue avec statut ${response.status}`);
    console.log(`Données de réponse: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    console.error('----------------------------------------');
    console.error(`ERREUR LORS DE L'ENVOI À L'API: ${targetApiUrl}`);
    console.error(`Message d'erreur: ${error.message}`);
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

module.exports = {
  sendActionsToApi
}; 