const express = require("express");
const path = require("path");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const cors = require("cors");
const morgan = require('morgan');
const healthCheckService = require('./services/healthCheckService');
const emergencyStopService = require('./services/emergencyStopService');

// Charger le fichier swagger.yaml
const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));

// const authRoutes = require('./routes/authRoutes'); // Supprimé
const svgRoutes = require("./routes/svgRoutes");
const dxfRoutes = require("./routes/dxfRoutes");
const dxfSequenceRoutes = require("./routes/dxfSequenceRoutes");
const combinedRoutes = require("./routes/combinedRoutes");
const directUploadRoutes = require("./routes/directUploadRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const testRoutes = require("./routes/testRoutes");
const statusRoutes = require("./routes/statusRoutes");
const svgLibraryRoutes = require("./routes/svgLibraryRoutes");
const productionJobRoutes = require("./routes/productionJobRoutes");

// Middleware
const configMiddleware = require('./middlewares/configMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Utiliser le middleware CORS
app.use(cors());

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Créer le dossier pour les séquences générées s'il n'existe pas
const sequencesDir = path.join(__dirname, "generated_sequences");
if (!fs.existsSync(sequencesDir)) {
  fs.mkdirSync(sequencesDir, { recursive: true });
}

// Créer le dossier pour les fichiers DXF générés s'il n'existe pas
const dxfDir = path.join(__dirname, "generated_dxf");
if (!fs.existsSync(dxfDir)) {
  fs.mkdirSync(dxfDir, { recursive: true });
}

// Créer le dossier pour les logs s'il n'existe pas
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Créer le dossier pour la bibliothèque SVG s'il n'existe pas
const svgLibraryDir = path.join(__dirname, 'svg_library');
if (!fs.existsSync(svgLibraryDir)) {
  fs.mkdirSync(svgLibraryDir, { recursive: true });
}

// Logging middleware
app.use(morgan('dev'));
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' })
}));

// Route pour la documentation Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes API
// app.use('/api/auth', authRoutes); // Supprimé
app.use("/api/svg", svgRoutes);
app.use("/api/dxf", dxfRoutes);
app.use("/api/dxf-sequence", dxfSequenceRoutes);
app.use("/api/combined", combinedRoutes);
app.use("/api/direct", directUploadRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/test", testRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/library", svgLibraryRoutes);
app.use("/api/production-jobs", productionJobRoutes);

// Route de test
app.get("/", (req, res) => {
  res.send(
    'API SVG fonctionnelle! Consultez la documentation à <a href="/api-docs">cette adresse</a>.'
  );
});

// Route d'accueil et de santé
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API de conversion SVG',
    status: 'running',
    links: {
      documentation: '/docs',
      healthcheck: '/api/healthcheck'
    }
  });
});

// Route de santé de l'API
app.get('/api/healthcheck', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Route pour l'arrêt d'urgence
app.post('/api/emergency-stop', async (req, res) => {
  try {
    const stopResult = await emergencyStopService.triggerEmergencyStop();
    if (stopResult.success) {
      res.status(200).json({
        success: true,
        message: stopResult.message || 'Arrêt d\'urgence déclenché avec succès',
        details: stopResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: stopResult.message || 'Échec du déclenchement de l\'arrêt d\'urgence',
        error: stopResult.error ? stopResult.error.message || stopResult.error : 'Erreur inconnue du service d\'arrêt'
      });
    }
  } catch (serviceError) {
    console.error("Erreur inattendue dans le service d'arrêt d'urgence:", serviceError);
    res.status(500).json({
      success: false,
      message: "Erreur serveur interne lors de la tentative d'arrêt d'urgence.",
      error: serviceError.message
    });
  }
});

// Route pour vérifier la santé de l'API cible
app.get('/api/target-health', async (req, res) => {
  try {
    const healthCheck = await healthCheckService.checkTargetApiHealth();
    res.json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification de santé de l\'API cible',
      error: error.message
    });
  }
});

// Middleware de gestion d'erreurs
app.use(errorMiddleware);

module.exports = app;
