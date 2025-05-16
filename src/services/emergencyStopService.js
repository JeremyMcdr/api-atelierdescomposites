const axios = require('axios');
const config = require('../config/appConfig');

/**
 * Déclenche un arrêt d'urgence sur l'API cible
 * @returns {Promise<object>} Résultat de l'opération
 */
async function triggerEmergencyStop() {
  try {
    // Extraire l'URL de base à partir de l'URL complète de l'API
    const targetUrl = config.TARGET_API_URL;
    const baseUrl = new URL(targetUrl).origin;
    const emergencyEndpoint = `${baseUrl}/emergency-stop`;
    
    console.log(`🚨 Déclenchement de l'arrêt d'urgence sur ${emergencyEndpoint}...`);
    
    const response = await axios.post(emergencyEndpoint, {
      timestamp: new Date().toISOString(),
      source: 'svg_api'
    }, { 
      timeout: config.API_REQUEST_TIMEOUT 
    });
    
    console.log(`✅ Arrêt d'urgence envoyé avec succès à l'API cible`);
    return {
      success: true,
      message: 'Arrêt d\'urgence envoyé avec succès',
      data: response.data
    };
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'arrêt d'urgence: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`L'API cible n'est pas accessible à l'adresse configurée.`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`La connexion à l'API cible a expiré.`);
    }
    
    return {
      success: false,
      message: `Impossible d'envoyer l'arrêt d'urgence: ${error.message}`,
      error: error
    };
  }
}

module.exports = {
  triggerEmergencyStop
}; 