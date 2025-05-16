const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const { execSync } = require('child_process');

/**
 * Convertit un fichier SVG en DXF
 * @param {string} svgFilePath - Chemin vers le fichier SVG à convertir
 * @param {string} outputDir - Dossier de sortie pour le fichier DXF
 * @returns {Promise<string>} - Chemin vers le fichier DXF généré
 */
async function convertSVGToDXF(svgFilePath, outputDir) {
  try {
    // Vérifier que le fichier SVG existe
    if (!fs.existsSync(svgFilePath)) {
      throw new Error(`Le fichier SVG n'existe pas : ${svgFilePath}`);
    }

    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Déterminer le nom du fichier de sortie
    const svgFileName = path.basename(svgFilePath, '.svg');
    const dxfFilePath = path.join(outputDir, `${svgFileName}.dxf`);

    // Lire le contenu du fichier SVG
    const svgContent = fs.readFileSync(svgFilePath, 'utf8');

    // Utiliser la bibliothèque dxf pour créer un fichier DXF
    // Ce code crée un DXF simple à partir des informations extraites du SVG
    await generateDXFFile(svgContent, dxfFilePath);

    return dxfFilePath;
  } catch (error) {
    console.error("Erreur lors de la conversion SVG vers DXF:", error);
    throw new Error(`Échec de la conversion SVG vers DXF: ${error.message}`);
  }
}

/**
 * Génère un fichier DXF à partir du contenu SVG
 * @param {string} svgContent - Contenu du fichier SVG
 * @param {string} outputFilePath - Chemin du fichier DXF à générer
 */
async function generateDXFFile(svgContent, outputFilePath) {
  try {
    // Parser le SVG pour extraire les entités
    const parser = new xml2js.Parser({
      explicitArray: false,
      explicitChildren: true,
      preserveChildrenOrder: true
    });
    
    const svgData = await parser.parseStringPromise(svgContent);
    
    // Créer un contenu DXF basique en utilisant le format ASCII DXF
    // Ceci est une implémentation très basique du format DXF
    let dxfContent = generateDXFContent(svgData);
    
    // Écrire le contenu dans le fichier DXF
    fs.writeFileSync(outputFilePath, dxfContent);
    
    console.log(`Fichier DXF généré avec succès: ${outputFilePath}`);
  } catch (error) {
    console.error("Erreur lors de la génération du fichier DXF:", error);
    throw error;
  }
}

/**
 * Génère le contenu DXF à partir des données SVG
 * @param {Object} svgData - Données SVG parsées
 * @returns {string} - Contenu DXF généré
 */
function generateDXFContent(svgData) {
  // Format DXF ASCII simplifié
  let dxfContent = "0\nSECTION\n";
  dxfContent += "2\nHEADER\n";
  dxfContent += "0\nENDSEC\n";
  
  // Section ENTITIES
  dxfContent += "0\nSECTION\n";
  dxfContent += "2\nENTITIES\n";
  
  // Extraire et convertir les entités du SVG
  const entities = extractEntitiesFromSVG(svgData);
  
  // Ajouter les entités au contenu DXF
  dxfContent += entities.join('\n');
  
  // Fin de section et fichier
  dxfContent += "0\nENDSEC\n";
  dxfContent += "0\nEOF";
  
  return dxfContent;
}

/**
 * Extrait les entités géométriques d'un fichier SVG sous forme de chaînes au format DXF
 * @param {Object} svgData - Les données SVG parsées
 * @returns {Array<string>} - Liste des entités DXF sous forme de chaînes
 */
function extractEntitiesFromSVG(svgData) {
  const dxfEntities = [];
  
  try {
    if (!svgData || !svgData.svg) {
      throw new Error("Format SVG invalide ou incomplet");
    }
    
    // Récupérer les éléments du SVG
    const svg = svgData.svg;
    
    // Traiter les différents types d'éléments SVG
    processElement(svg, dxfEntities);
    
  } catch (error) {
    console.error("Erreur lors de l'extraction des entités du SVG:", error);
  }
  
  return dxfEntities;
}

/**
 * Traite récursivement les éléments SVG et les convertit en entités DXF
 * @param {Object} element - Élément SVG à traiter
 * @param {Array<string>} dxfEntities - Liste des entités DXF à compléter
 */
function processElement(element, dxfEntities) {
  // Traiter tous les sous-éléments de l'élément actuel
  for (const key in element) {
    if (key === '$' || key === '_') continue;
    
    const items = Array.isArray(element[key]) ? element[key] : [element[key]];
    
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      
      // Traiter les différents types d'éléments SVG selon leur nom
      switch (key) {
        case 'path':
          if (item.$ && item.$.d) {
            const pathEntity = convertPathToDXF(item);
            if (pathEntity) dxfEntities.push(pathEntity);
          }
          break;
        case 'rect':
          if (item.$) {
            const rectEntity = convertRectToDXF(item);
            if (rectEntity) dxfEntities.push(rectEntity);
          }
          break;
        case 'circle':
          if (item.$) {
            const circleEntity = convertCircleToDXF(item);
            if (circleEntity) dxfEntities.push(circleEntity);
          }
          break;
        case 'line':
          if (item.$) {
            const lineEntity = convertLineToDXF(item);
            if (lineEntity) dxfEntities.push(lineEntity);
          }
          break;
        case 'polyline':
          if (item.$ && item.$.points) {
            const polylineEntity = convertPolylineToDXF(item);
            if (polylineEntity) dxfEntities.push(polylineEntity);
          }
          break;
        case 'polygon':
          if (item.$ && item.$.points) {
            const polygonEntity = convertPolygonToDXF(item);
            if (polygonEntity) dxfEntities.push(polygonEntity);
          }
          break;
        case 'g':
          // Traiter les groupes récursivement
          processElement(item, dxfEntities);
          break;
        default:
          // Pour tout autre élément, chercher des sous-éléments
          if (typeof item === 'object') {
            processElement(item, dxfEntities);
          }
      }
    }
  }
}

// Fonctions de conversion des éléments SVG en entités DXF

function convertPathToDXF(path) {
  // Note: La conversion des chemins SVG nécessite une implémentation plus complexe
  // Pour cette démonstration, on renvoie une entité LINE simplifiée
  return "0\nLINE\n8\n0\n10\n0\n20\n0\n11\n10\n21\n10";
}

function convertRectToDXF(rect) {
  const x = parseFloat(rect.$.x || 0);
  const y = parseFloat(rect.$.y || 0);
  const width = parseFloat(rect.$.width || 0);
  const height = parseFloat(rect.$.height || 0);
  
  // Créer une polyline fermée représentant le rectangle
  let entity = "0\nLWPOLYLINE\n";
  entity += "8\n0\n"; // Layer
  entity += "90\n4\n"; // Nombre de vertices
  entity += "70\n1\n"; // Fermée
  
  // Points du rectangle
  entity += `10\n${x}\n20\n${y}\n`; // Point 1
  entity += `10\n${x + width}\n20\n${y}\n`; // Point 2
  entity += `10\n${x + width}\n20\n${y + height}\n`; // Point 3
  entity += `10\n${x}\n20\n${y + height}`; // Point 4
  
  return entity;
}

function convertCircleToDXF(circle) {
  const cx = parseFloat(circle.$.cx || 0);
  const cy = parseFloat(circle.$.cy || 0);
  const r = parseFloat(circle.$.r || 0);
  
  let entity = "0\nCIRCLE\n";
  entity += "8\n0\n"; // Layer
  entity += `10\n${cx}\n`; // Centre X
  entity += `20\n${cy}\n`; // Centre Y
  entity += `40\n${r}`; // Rayon
  
  return entity;
}

function convertLineToDXF(line) {
  const x1 = parseFloat(line.$.x1 || 0);
  const y1 = parseFloat(line.$.y1 || 0);
  const x2 = parseFloat(line.$.x2 || 0);
  const y2 = parseFloat(line.$.y2 || 0);
  
  let entity = "0\nLINE\n";
  entity += "8\n0\n"; // Layer
  entity += `10\n${x1}\n`; // Start X
  entity += `20\n${y1}\n`; // Start Y
  entity += `11\n${x2}\n`; // End X
  entity += `21\n${y2}`; // End Y
  
  return entity;
}

function convertPolylineToDXF(polyline) {
  const points = parsePointsString(polyline.$.points);
  if (!points.length) return null;
  
  let entity = "0\nLWPOLYLINE\n";
  entity += "8\n0\n"; // Layer
  entity += `90\n${points.length}\n`; // Nombre de vertices
  entity += "70\n0\n"; // Non fermée
  
  // Points de la polyline
  points.forEach(point => {
    entity += `10\n${point.x}\n20\n${point.y}\n`;
  });
  
  return entity;
}

function convertPolygonToDXF(polygon) {
  const points = parsePointsString(polygon.$.points);
  if (!points.length) return null;
  
  let entity = "0\nLWPOLYLINE\n";
  entity += "8\n0\n"; // Layer
  entity += `90\n${points.length}\n`; // Nombre de vertices
  entity += "70\n1\n"; // Fermée
  
  // Points du polygone
  points.forEach(point => {
    entity += `10\n${point.x}\n20\n${point.y}\n`;
  });
  
  return entity;
}

function parsePointsString(pointsStr) {
  if (!pointsStr) return [];
  
  // Nettoyer et parser la chaîne de points
  const cleanedStr = pointsStr.replace(/,/g, ' ').trim();
  const pointValues = cleanedStr.split(/\s+/).map(parseFloat);
  
  // Regrouper par paires (x,y)
  const points = [];
  for (let i = 0; i < pointValues.length; i += 2) {
    if (i + 1 < pointValues.length) {
      points.push({ x: pointValues[i], y: pointValues[i + 1] });
    }
  }
  
  return points;
}

module.exports = {
  convertSVGToDXF
}; 