const app = require('./app');

const PORT = process.env.PORT || 30001;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}); 