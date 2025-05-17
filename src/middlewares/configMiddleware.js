/**
 * Middleware de configuration pour l'application
 * Charge les configurations et prépare l'environnement
 */

const path = require('path');
const appConfig = require('../config/appConfig');

/**
 * Middleware qui ajoute les configurations globales à l'objet req
 * pour qu'elles soient disponibles dans tous les contrôleurs
 */
const configMiddleware = (req, res, next) => {
  // Ajouter les configurations à l'objet req
  req.appConfig = appConfig;
  
  // Ajouter des chemins utiles
  req.paths = {
    uploadsDir: path.join(__dirname, '../uploads'),
    sequencesDir: path.join(__dirname, '../generated_sequences'),
    dxfDir: path.join(__dirname, '../generated_dxf'),
    svgLibraryDir: path.join(__dirname, '../svg_library')
  };
  
  // Ajouter des helpers utiles
  req.helpers = {
    formatDate: (date) => {
      return new Date(date).toLocaleString('fr-FR');
    }
  };
  
  next();
};

module.exports = configMiddleware; 