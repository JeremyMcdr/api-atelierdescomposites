const axios = require('axios');
const config = require('../config/appConfig');

/**
 * Vérifie l'état de santé de l'API cible
 * @returns {Promise<object>} Résultat de la vérification
 */
async function checkTargetApiHealth() {
  try {
    // Extraire l'URL de base à partir de l'URL complète de l'API
    const targetUrl = config.TARGET_API_URL;
    const baseUrl = new URL(targetUrl).origin;
    const healthEndpoint = `${baseUrl}/health`;
    
    console.log(`Vérification de l'état de santé de l'API cible à ${healthEndpoint}...`);
    
    const response = await axios.get(healthEndpoint, { 
      timeout: config.API_REQUEST_TIMEOUT 
    });
    
    if (response.status === 200 && response.data.status) {
      console.log(`✅ API cible opérationnelle: ${response.data.status}`);
      console.log(`📅 Timestamp: ${response.data.timestamp}`);
      return {
        success: true,
        message: 'API cible accessible et opérationnelle',
        data: response.data
      };
    } else {
      console.warn(`⚠️ L'API cible a répondu, mais la structure de réponse est inattendue`);
      return {
        success: false,
        message: 'Réponse inattendue de l\'API cible',
        data: response.data
      };
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de l'API cible: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`L'API cible n'est pas accessible à l'adresse configurée.`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`La connexion à l'API cible a expiré.`);
    }
    
    return {
      success: false,
      message: `Impossible de se connecter à l'API cible: ${error.message}`,
      error: error
    };
  }
}

module.exports = {
  checkTargetApiHealth
}; 