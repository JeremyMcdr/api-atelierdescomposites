const fs = require('fs');
const path = require('path');

// Constante pour l'angle maximum autorisé pour le pliage (en degrés)
const MAX_BEND_ANGLE = 65;

/**
 * Calcule l'angle et la distance entre deux points
 * @param {object} point1 - Premier point {x, y}
 * @param {object} point2 - Second point {x, y}
 * @returns {object} - Angle et distance
 */
function calculateVector(point1, point2) {
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Angle en degrés
  return { distance, angle };
}

/**
 * Calcule le point milieu entre deux points
 * @param {object} point1 - Premier point {x, y}
 * @param {object} point2 - Second point {x, y}
 * @returns {object} - Point milieu {x, y}
 */
function calculateMidpoint(point1, point2) {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2
  };
}

/**
 * Divise un angle de rotation en plusieurs étapes ne dépassant pas l'angle maximum autorisé
 * @param {number} rotationAngle - Angle de rotation total requis (en degrés)
 * @returns {Array<number>} - Liste des angles de rotation successifs
 */
function divideRotation(rotationAngle) {
  const result = [];
  const absAngle = Math.abs(rotationAngle);
  const sign = Math.sign(rotationAngle);
  
  // Si l'angle est déjà dans les limites autorisées, le retourner tel quel
  if (absAngle <= MAX_BEND_ANGLE) {
    return [rotationAngle];
  }
  
  // Calculer le nombre d'étapes nécessaires
  const steps = Math.ceil(absAngle / MAX_BEND_ANGLE);
  // Répartir l'angle équitablement entre les étapes
  const anglePerStep = absAngle / steps;
  
  // Générer les étapes de rotation
  for (let i = 0; i < steps; i++) {
    result.push(parseFloat((sign * anglePerStep).toFixed(2)));
  }
  
  return result;
}

/**
 * Parse un fichier DXF et le transforme en séquence d'actions
 * @param {string} dxfFilePath - Chemin vers le fichier DXF
 * @param {object} options - Options de conversion
 * @param {boolean} options.closePolygons - Si true, ferme automatiquement les polygones (défaut: true)
 * @param {boolean} options.startAtLongestSegment - Si true, commence au milieu du segment le plus long (défaut: true)
 * @returns {Promise<Array>} - Une promesse résolvant avec un tableau d'actions
 */
async function parseDxfToActions(dxfFilePath, options = {}) {
  // Options par défaut
  const shouldClosePolygons = options.closePolygons !== undefined ? options.closePolygons : true;
  const startAtLongestSegment = options.startAtLongestSegment !== undefined ? options.startAtLongestSegment : true;
  
  try {
    // Vérifier que le fichier DXF existe
    if (!fs.existsSync(dxfFilePath)) {
      throw new Error(`Le fichier DXF n'existe pas : ${dxfFilePath}`);
    }

    // Lire le contenu du fichier DXF
    const dxfContent = fs.readFileSync(dxfFilePath, 'utf8');
    
    // Extraire les entités du DXF
    const entities = extractEntitiesFromDXF(dxfContent);
    
    // Convertir les entités en actions
    return convertEntitiesToActions(entities, { 
      shouldClosePolygons,
      startAtLongestSegment
    });
  } catch (error) {
    console.error("Erreur lors du parsing du DXF:", error);
    throw error;
  }
}

/**
 * Extrait les entités d'un fichier DXF
 * @param {string} dxfContent - Contenu du fichier DXF
 * @returns {Array} - Liste des entités (points)
 */
function extractEntitiesFromDXF(dxfContent) {
  const entities = [];
  let currentEntity = null;
  let inEntitiesSection = false;
  let entityType = null;
  
  // Parser le contenu du fichier DXF (format ASCII)
  const lines = dxfContent.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const code = lines[i].trim();
    const value = i + 1 < lines.length ? lines[i + 1].trim() : '';
    i++; // Avancer d'une ligne supplémentaire puisque nous avons déjà lu la valeur
    
    // Chercher la section ENTITIES
    if (code === '0' && value === 'SECTION') {
      const sectionTypeCode = lines[i + 1].trim();
      const sectionType = lines[i + 2].trim();
      if (sectionTypeCode === '2' && sectionType === 'ENTITIES') {
        inEntitiesSection = true;
        i += 2; // Sauter ces deux lignes
      }
    }
    // Fin de la section ENTITIES
    else if (code === '0' && value === 'ENDSEC') {
      inEntitiesSection = false;
    }
    // Nouvelle entité dans la section ENTITIES
    else if (inEntitiesSection && code === '0') {
      // Si nous avions déjà une entité, l'ajouter à la liste
      if (currentEntity && Object.keys(currentEntity).length > 0) {
        entities.push(currentEntity);
      }
      
      // Démarrer une nouvelle entité
      entityType = value;
      currentEntity = { type: entityType };
      
      // Initialiser les structures pour différents types d'entités
      if (entityType === 'LINE') {
        currentEntity.start = { x: 0, y: 0 };
        currentEntity.end = { x: 0, y: 0 };
      } else if (entityType === 'LWPOLYLINE' || entityType === 'POLYLINE') {
        currentEntity.vertices = [];
        currentEntity.closed = false;
      } else if (entityType === 'CIRCLE') {
        currentEntity.center = { x: 0, y: 0 };
        currentEntity.radius = 0;
      }
    }
    // Parser les attributs de l'entité actuelle
    else if (inEntitiesSection && currentEntity) {
      // Group code 10: X coordinate (start point for LINE, center for CIRCLE, vertex for POLYLINE, etc.)
      if (code === '10') {
        const x = parseFloat(value);
        if (entityType === 'LINE') {
          currentEntity.start.x = x;
        } else if (entityType === 'LWPOLYLINE' || entityType === 'POLYLINE') {
          let lastVertex = currentEntity.vertices[currentEntity.vertices.length - 1];
          if (!lastVertex || lastVertex.y !== undefined) { // Si dernier vertex complet ou pas de vertex
            lastVertex = { x: x };
            currentEntity.vertices.push(lastVertex);
          } else {
            lastVertex.x = x; // Mettre à jour le X du dernier vertex incomplet
          }
        } else if (entityType === 'CIRCLE') {
          currentEntity.center.x = x;
        }
      }
      // Group code 20: Y coordinate (start point for LINE, center for CIRCLE, vertex for POLYLINE, etc.)
      else if (code === '20') {
        const y = parseFloat(value);
        if (entityType === 'LINE') {
          currentEntity.start.y = y;
        } else if (entityType === 'LWPOLYLINE' || entityType === 'POLYLINE') {
          let lastVertex = currentEntity.vertices[currentEntity.vertices.length - 1];
          if (lastVertex && lastVertex.x !== undefined && lastVertex.y === undefined) {
            lastVertex.y = y; // Compléter le Y du dernier vertex
          } else {
            // Cas improbable où nous aurions un Y sans X
            lastVertex = { y: y };
            currentEntity.vertices.push(lastVertex);
          }
        } else if (entityType === 'CIRCLE') {
          currentEntity.center.y = y;
        }
      }
      // Group code 11: X coordinate (end point for LINE)
      else if (code === '11' && entityType === 'LINE') {
        currentEntity.end.x = parseFloat(value);
      }
      // Group code 21: Y coordinate (end point for LINE)
      else if (code === '21' && entityType === 'LINE') {
        currentEntity.end.y = parseFloat(value);
      }
      // Group code 40: Radius for CIRCLE
      else if (code === '40' && entityType === 'CIRCLE') {
        currentEntity.radius = parseFloat(value);
      }
      // Group code 70: Polyline flag (bit 0 = closed, 1 = open)
      else if (code === '70' && (entityType === 'LWPOLYLINE' || entityType === 'POLYLINE')) {
        const flag = parseInt(value, 10);
        currentEntity.closed = (flag & 1) === 1; // Bit 0 set = closed
      }
    }
  }
  
  // Ajouter la dernière entité si elle existe
  if (currentEntity && Object.keys(currentEntity).length > 0) {
    entities.push(currentEntity);
  }
  
  return entities;
}

/**
 * Trouve le segment le plus long dans les entités et retourne son point milieu et son angle
 * @param {Array} entities - Liste des entités
 * @returns {Object|null} - { midpoint, angle, length } ou null si aucun segment trouvé
 */
function findLongestSegment(entities) {
  let longestSegment = {
    start: null,
    end: null,
    length: 0,
    angle: 0
  };

  // Parcourir toutes les entités pour trouver le segment le plus long
  for (const entity of entities) {
    if (entity.type === 'LINE') {
      // Pour les lignes, c'est simple
      const vector = calculateVector(entity.start, entity.end);
      if (vector.distance > longestSegment.length) {
        longestSegment = {
          start: entity.start,
          end: entity.end,
          length: vector.distance,
          angle: vector.angle
        };
      }
    } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
      // Pour les polylignes, parcourir tous les segments
      const vertices = entity.vertices;
      if (vertices.length > 1) {
        for (let i = 0; i < vertices.length - 1; i++) {
          const vector = calculateVector(vertices[i], vertices[i + 1]);
          if (vector.distance > longestSegment.length) {
            longestSegment = {
              start: vertices[i],
              end: vertices[i + 1],
              length: vector.distance,
              angle: vector.angle
            };
          }
        }
        
        // Vérifier aussi le segment de fermeture si la polyligne est fermée
        if (entity.closed && vertices.length > 2) {
          const vector = calculateVector(vertices[vertices.length - 1], vertices[0]);
          if (vector.distance > longestSegment.length) {
            longestSegment = {
              start: vertices[vertices.length - 1],
              end: vertices[0],
              length: vector.distance,
              angle: vector.angle
            };
          }
        }
      }
    }
    // Ne pas prendre en compte les cercles pour le segment le plus long
  }
  
  if (!longestSegment.start) {
    return null;
  }
  
  return {
    midpoint: calculateMidpoint(longestSegment.start, longestSegment.end),
    angle: longestSegment.angle,
    length: longestSegment.length
  };
}

/**
 * Convertit les entités extraites du DXF en actions machine
 * @param {Array} entities - Liste des entités
 * @param {object} options - Options de conversion
 * @param {boolean} options.shouldClosePolygons - Si true, ferme automatiquement les polygones
 * @param {boolean} options.startAtLongestSegment - Si true, commence au milieu du segment le plus long
 * @returns {Array} - Liste des actions
 */
function convertEntitiesToActions(entities, options = {}) {
  const { shouldClosePolygons = true, startAtLongestSegment = true } = options;
  const actions = [];
  
  // Position et angle de départ
  let currentPosition = { x: 0, y: 0 };
  let currentAngle = 0;
  
  // Si on doit commencer au milieu du segment le plus long
  if (startAtLongestSegment) {
    const longestSegmentInfo = findLongestSegment(entities);
    if (longestSegmentInfo) {
      console.log(`Segment le plus long trouvé: longueur ${longestSegmentInfo.length.toFixed(2)}, angle ${longestSegmentInfo.angle.toFixed(2)}`);
      // Commencer au milieu du segment le plus long
      currentPosition = longestSegmentInfo.midpoint;
      currentAngle = longestSegmentInfo.angle;
      
      // Ajouter la première action (AVANCER de la moitié de la longueur)
      const halfLength = longestSegmentInfo.length / 2;
      if (halfLength > 0.001) {
        actions.push({ action: 'AVANCER', valeur: parseFloat(halfLength.toFixed(3)) });
      }
    } else {
      console.log("Aucun segment trouvé pour commencer, utilisation de la position (0,0)");
    }
  }

  // Traiter toutes les entités
  for (const entity of entities) {
    switch (entity.type) {
      case 'LINE':
        processLine(entity, actions, currentPosition, currentAngle);
        // Mettre à jour la position actuelle
        currentPosition = { ...entity.end };
        break;
      case 'LWPOLYLINE':
      case 'POLYLINE':
        processPolyline(entity, actions, currentPosition, currentAngle, shouldClosePolygons);
        // Mettre à jour la position actuelle si des vertices existent
        if (entity.vertices.length > 0) {
          const lastVertex = entity.vertices[entity.vertices.length - 1];
          currentPosition = { x: lastVertex.x, y: lastVertex.y };
        }
        break;
      case 'CIRCLE':
        // La gestion d'un cercle est plus complexe - nous allons l'approximer avec des segments
        processCircle(entity, actions, currentPosition, currentAngle);
        // La position finale dépend de comment on approxime le cercle - ici on revient au centre
        currentPosition = { ...entity.center };
        break;
    }
  }

  // Ajouter une action COUPER à la fin
  actions.push({ action: 'COUPER' });

  return actions;
}

/**
 * Traite une entité LINE
 * @param {Object} line - L'entité LINE
 * @param {Array} actions - La liste des actions à mettre à jour
 * @param {Object} currentPosition - La position actuelle {x, y}
 * @param {Number} currentAngle - L'angle actuel de la machine en degrés
 */
function processLine(line, actions, currentPosition, currentAngle) {
  // Calculer le vecteur (angle et distance) entre la position actuelle et le début de la ligne
  const vectorToStart = calculateVector(currentPosition, line.start);
  
  // Se positionner au début de la ligne si nécessaire
  if (vectorToStart.distance > 0.001) {
    // Tourner vers le point de départ
    const rotationAngle = vectorToStart.angle - currentAngle;
    if (Math.abs(rotationAngle) > 0.001) {
      // Diviser la rotation en plusieurs étapes si nécessaire
      const rotationSteps = divideRotation(parseFloat(rotationAngle.toFixed(2)));
      for (const stepAngle of rotationSteps) {
        actions.push({ action: 'PLIER', valeur: stepAngle });
      }
      currentAngle = vectorToStart.angle;
    }
    
    // Avancer jusqu'au point de départ
    actions.push({ action: 'AVANCER', valeur: parseFloat(vectorToStart.distance.toFixed(3)) });
    currentPosition = { ...line.start };
  }
  
  // Calculer le vecteur entre le début et la fin de la ligne
  const vectorLine = calculateVector(line.start, line.end);
  
  // Tourner vers la direction de la ligne si nécessaire
  const rotationAngle = vectorLine.angle - currentAngle;
  if (Math.abs(rotationAngle) > 0.001) {
    // Diviser la rotation en plusieurs étapes si nécessaire
    const rotationSteps = divideRotation(parseFloat(rotationAngle.toFixed(2)));
    for (const stepAngle of rotationSteps) {
      actions.push({ action: 'PLIER', valeur: stepAngle });
    }
    currentAngle = vectorLine.angle;
  }
  
  // Avancer le long de la ligne
  actions.push({ action: 'AVANCER', valeur: parseFloat(vectorLine.distance.toFixed(3)) });
}

/**
 * Traite une entité POLYLINE ou LWPOLYLINE
 * @param {Object} polyline - L'entité POLYLINE
 * @param {Array} actions - La liste des actions à mettre à jour
 * @param {Object} currentPosition - La position actuelle {x, y}
 * @param {Number} currentAngle - L'angle actuel de la machine en degrés
 * @param {Boolean} shouldClosePolygons - Si true, ferme automatiquement les polygones fermés
 */
function processPolyline(polyline, actions, currentPosition, currentAngle, shouldClosePolygons = true) {
  if (!polyline.vertices || polyline.vertices.length === 0) {
    return;
  }
  
  // Se positionner au premier point de la polyligne
  const firstVertex = polyline.vertices[0];
  const vectorToStart = calculateVector(currentPosition, firstVertex);
  
  // Tourner vers le premier point si nécessaire
  if (vectorToStart.distance > 0.001) {
    const rotationAngle = vectorToStart.angle - currentAngle;
    if (Math.abs(rotationAngle) > 0.001) {
      // Diviser la rotation en plusieurs étapes si nécessaire
      const rotationSteps = divideRotation(parseFloat(rotationAngle.toFixed(2)));
      for (const stepAngle of rotationSteps) {
        actions.push({ action: 'PLIER', valeur: stepAngle });
      }
      currentAngle = vectorToStart.angle;
    }
    
    // Avancer jusqu'au premier point
    actions.push({ action: 'AVANCER', valeur: parseFloat(vectorToStart.distance.toFixed(3)) });
    currentPosition = { ...firstVertex };
  }
  
  // Parcourir les segments de la polyligne
  for (let i = 1; i < polyline.vertices.length; i++) {
    const startPoint = polyline.vertices[i - 1];
    const endPoint = polyline.vertices[i];
    const vectorSegment = calculateVector(startPoint, endPoint);
    
    // Tourner vers la direction du segment si nécessaire
    const rotationAngle = vectorSegment.angle - currentAngle;
    if (Math.abs(rotationAngle) > 0.001) {
      // Diviser la rotation en plusieurs étapes si nécessaire
      const rotationSteps = divideRotation(parseFloat(rotationAngle.toFixed(2)));
      for (const stepAngle of rotationSteps) {
        actions.push({ action: 'PLIER', valeur: stepAngle });
      }
      currentAngle = vectorSegment.angle;
    }
    
    // Avancer le long du segment
    actions.push({ action: 'AVANCER', valeur: parseFloat(vectorSegment.distance.toFixed(3)) });
    currentPosition = { ...endPoint };
  }
  
  // Si l'option est activée et que la polyligne est fermée, fermer le chemin en revenant au premier point
  if (shouldClosePolygons && polyline.closed && polyline.vertices.length > 1) {
    const lastVertex = polyline.vertices[polyline.vertices.length - 1];
    const firstVertex = polyline.vertices[0];
    const vectorClose = calculateVector(lastVertex, firstVertex);
    
    // Tourner vers le premier point si nécessaire
    const rotationAngle = vectorClose.angle - currentAngle;
    if (Math.abs(rotationAngle) > 0.001) {
      // Diviser la rotation en plusieurs étapes si nécessaire
      const rotationSteps = divideRotation(parseFloat(rotationAngle.toFixed(2)));
      for (const stepAngle of rotationSteps) {
        actions.push({ action: 'PLIER', valeur: stepAngle });
      }
      currentAngle = vectorClose.angle;
    }
    
    // Avancer jusqu'au premier point
    actions.push({ action: 'AVANCER', valeur: parseFloat(vectorClose.distance.toFixed(3)) });
    currentPosition = { ...firstVertex };
  }
}

/**
 * Traite une entité CIRCLE
 * @param {Object} circle - L'entité CIRCLE
 * @param {Array} actions - La liste des actions à mettre à jour
 * @param {Object} currentPosition - La position actuelle {x, y}
 * @param {Number} currentAngle - L'angle actuel de la machine en degrés
 */
function processCircle(circle, actions, currentPosition, currentAngle) {
  const numSegments = 24; // Nombre de segments pour approximer le cercle
  const angleStep = 360 / numSegments;
  
  // Calculer le vecteur entre la position actuelle et le centre du cercle
  const vectorToCenter = calculateVector(currentPosition, circle.center);
  
  // Tourner vers le centre du cercle si nécessaire
  if (vectorToCenter.distance > 0.001) {
    const rotationAngle = vectorToCenter.angle - currentAngle;
    if (Math.abs(rotationAngle) > 0.001) {
      // Diviser la rotation en plusieurs étapes si nécessaire
      const rotationSteps = divideRotation(parseFloat(rotationAngle.toFixed(2)));
      for (const stepAngle of rotationSteps) {
        actions.push({ action: 'PLIER', valeur: stepAngle });
      }
      currentAngle = vectorToCenter.angle;
    }
    
    // Avancer jusqu'au centre du cercle
    actions.push({ action: 'AVANCER', valeur: parseFloat(vectorToCenter.distance.toFixed(3)) });
    currentPosition = { ...circle.center };
  }
  
  // Aller au point de départ du cercle (à droite du centre)
  const startPoint = {
    x: circle.center.x + circle.radius,
    y: circle.center.y
  };
  
  const vectorToStart = calculateVector(currentPosition, startPoint);
  const rotationToStart = vectorToStart.angle - currentAngle;
  if (Math.abs(rotationToStart) > 0.001) {
    // Diviser la rotation en plusieurs étapes si nécessaire
    const rotationSteps = divideRotation(parseFloat(rotationToStart.toFixed(2)));
    for (const stepAngle of rotationSteps) {
      actions.push({ action: 'PLIER', valeur: stepAngle });
    }
    currentAngle = vectorToStart.angle;
  }
  
  actions.push({ action: 'AVANCER', valeur: parseFloat(circle.radius.toFixed(3)) });
  currentPosition = { ...startPoint };
  
  // Tracer le cercle segment par segment
  for (let i = 1; i <= numSegments; i++) {
    const angle = i * angleStep * (Math.PI / 180); // Angle en radians
    const nextPoint = {
      x: circle.center.x + circle.radius * Math.cos(angle),
      y: circle.center.y + circle.radius * Math.sin(angle)
    };
    
    const vectorToNextPoint = calculateVector(currentPosition, nextPoint);
    const rotationAngle = vectorToNextPoint.angle - currentAngle;
    
    // Diviser la rotation en plusieurs étapes si nécessaire
    const rotationSteps = divideRotation(parseFloat(rotationAngle.toFixed(2)));
    for (const stepAngle of rotationSteps) {
      actions.push({ action: 'PLIER', valeur: stepAngle });
    }
    currentAngle = vectorToNextPoint.angle;
    
    // Avancer le long du segment courant
    actions.push({ action: 'AVANCER', valeur: parseFloat(vectorToNextPoint.distance.toFixed(3)) });
    currentPosition = { ...nextPoint };
  }
}

module.exports = {
  parseDxfToActions,
  MAX_BEND_ANGLE // Exporter la constante pour référence externe
}; 