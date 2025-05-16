const app = require('./app');
const { checkTargetApiHealth } = require('./services/healthCheckService');

const PORT = process.env.PORT || 30001;

app.listen(PORT, async () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  
  // Vérifier l'état de santé de l'API cible au démarrage
  try {
    await checkTargetApiHealth();
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'API cible: ${error.message}`);
    console.warn(`L'application continue de fonctionner malgré l'erreur de connexion à l'API cible.`);
  }
}); 