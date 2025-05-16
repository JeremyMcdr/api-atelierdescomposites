const fs = require('fs');
const path = require('path');
const dxfService = require('./dxfService');
const dxfParserService = require('./dxfParserService');
const apiService = require('./apiService');
const appConfig = require('../config/appConfig');

/**
 * Convertit directement un fichier SVG en séquence d'actions
 * @param {string} svgFilePath - Chemin vers le fichier SVG
 * @param {string} dxfOutputDir - Dossier de sortie pour les fichiers DXF intermédiaires
 * @param {Object} options - Options supplémentaires
 * @param {boolean} options.sendToApi - Si true, envoie les actions à l'API externe
 * @param {string} options.apiUrl - URL de l'API cible (remplace celle de la config)
 * @param {boolean} options.closePolygons - Si true, ferme automatiquement les polygones
 * @returns {Promise<Object>} - Une promesse résolvant avec les actions et la réponse de l'API
 */
async function convertSVGToActions(svgFilePath, dxfOutputDir, options = {}) {
  const { 
    sendToApi = appConfig.ENABLE_AUTO_API_SEND, 
    apiUrl = appConfig.TARGET_API_URL,
    closePolygons = true 
  } = options;
  
  let apiResponse = null;
  
  try {
    // 1. Vérifier que le fichier SVG existe
    if (!fs.existsSync(svgFilePath)) {
      throw new Error(`Le fichier SVG n'existe pas : ${svgFilePath}`);
    }

    // 2. Créer un dossier temporaire pour le DXF intermédiaire si nécessaire
    if (!fs.existsSync(dxfOutputDir)) {
      fs.mkdirSync(dxfOutputDir, { recursive: true });
    }

    // 3. Convertir le SVG en DXF
    console.log(`Conversion du SVG en DXF: ${svgFilePath}`);
    const dxfFilePath = await dxfService.convertSVGToDXF(svgFilePath, dxfOutputDir);
    console.log(`DXF généré: ${dxfFilePath}`);

    // 4. Convertir le DXF en séquence d'actions
    console.log(`Conversion du DXF en séquence d'actions: ${dxfFilePath}`);
    const actions = await dxfParserService.parseDxfToActions(dxfFilePath, { closePolygons });
    console.log(`Séquence d'actions générée avec ${actions.length} actions`);

    // 5. Envoyer à l'API externe si demandé
    if (sendToApi && apiUrl) {
      try {
        console.log(`Envoi des actions à l'API externe: ${apiUrl}`);
        apiResponse = await apiService.sendActionsToApi(actions, apiUrl, {
          timeout: appConfig.API_REQUEST_TIMEOUT
        });
        console.log('Actions envoyées avec succès à l\'API externe');
      } catch (apiError) {
        console.error('Erreur lors de l\'envoi à l\'API externe:', apiError.message);
        // Ne pas interrompre le traitement en cas d'échec d'envoi API
      }
    }

    return {
      actions,
      apiResponse,
      apiSent: Boolean(apiResponse)
    };
  } catch (error) {
    console.error("Erreur lors de la conversion SVG -> Actions:", error);
    throw error;
  }
}

module.exports = {
  convertSVGToActions
}; 