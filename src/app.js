const express = require("express");
const path = require("path");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const cors = require("cors");

// Charger le fichier swagger.yaml
const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));

// const authRoutes = require('./routes/authRoutes'); // Supprimé
const svgRoutes = require("./routes/svgRoutes");
const dxfRoutes = require("./routes/dxfRoutes");
const dxfSequenceRoutes = require("./routes/dxfSequenceRoutes");
const combinedRoutes = require("./routes/combinedRoutes");
const directUploadRoutes = require("./routes/directUploadRoutes");

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

// Route pour la documentation Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes API
// app.use('/api/auth', authRoutes); // Supprimé
app.use("/api/svg", svgRoutes);
app.use("/api/dxf", dxfRoutes);
app.use("/api/dxf-sequence", dxfSequenceRoutes);
app.use("/api/combined", combinedRoutes);
app.use("/api/direct", directUploadRoutes);

// Route de test
app.get("/", (req, res) => {
  res.send(
    'API SVG fonctionnelle! Consultez la documentation à <a href="/api-docs">cette adresse</a>.'
  );
});

module.exports = app;
