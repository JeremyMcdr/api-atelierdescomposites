module.exports = {
  // URL de l'API externe qui recevra les séquences d'actions
  TARGET_API_URL: process.env.TARGET_API_URL || 'http://localhost:3001/api/actions',
  
  // Timeout en millisecondes pour les requêtes vers l'API externe
  API_REQUEST_TIMEOUT: process.env.API_REQUEST_TIMEOUT ? parseInt(process.env.API_REQUEST_TIMEOUT) : 10000,
  
  // Activer/désactiver l'envoi automatique à l'API externe
  ENABLE_AUTO_API_SEND: process.env.ENABLE_AUTO_API_SEND === 'true' || false
}; 