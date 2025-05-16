// Pour l'instant, ce service va simuler la transformation.
// Dans une application réelle, vous auriez besoin d'une bibliothèque
// pour parser le SVG (comme 'svgo', 'xml2js', ou une analyse manuelle des chemins)
// et ensuite traduire ces chemins en commandes pour vos moteurs.

const { parseStringPromise, processors } = require('xml2js');
const { parseSVG, makeAbsolute } = require('svg-path-parser');

// Fonction utilitaire pour calculer l'angle et la distance entre deux points
function calculateVector(x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Angle en degrés
  return { distance, angle };
}

/**
 * Transforme le contenu d'un fichier SVG en une séquence d'actions pour les moteurs.
 * @param {string} svgContent Le contenu du fichier SVG.
 * @returns {Promise<Array<object>>} Une promesse qui résout avec un tableau d'actions.
 */
async function transformSVGToActions(svgContent) {
  console.log("Début de la transformation du SVG vers un format simplifié...");
  let simplifiedActions = []; // Tableau pour les actions simplifiées
  let currentPosition = { x: 0, y: 0 };
  let currentAngle = 0; // Angle actuel de la machine en degrés
  let pathStartPoint = { x: 0, y: 0 };
  let isToolDown = false; // Pour simuler l'état de l'outil (levé/abaissé)

  try {
    const parsedSvg = await parseStringPromise(svgContent, {
      explicitArray: false, explicitChildren: true, charkey: '_',
      tagNameProcessors: [processors.stripPrefix], attrNameProcessors: [processors.stripPrefix],
      valueProcessors: [processors.normalize], attrValueProcessors: [processors.normalize]
    });

    if (!parsedSvg.svg) {
      throw new Error('Tag SVG racine non trouvé après parsing.');
    }

    function processPathCommands(pathData) {
      try {
        const commands = makeAbsolute(parseSVG(pathData));
        console.log(`[Path Processor] Commandes absolues: ${JSON.stringify(commands.map(c=>c.code))}`);

        for (const cmd of commands) {
          let targetX = cmd.x !== undefined ? cmd.x : currentPosition.x;
          let targetY = cmd.y !== undefined ? cmd.y : currentPosition.y;
          let rotationAngle = 0;
          let distanceToMove = 0;

          switch (cmd.code) {
            case 'M': // Moveto (absolute)
              if (isToolDown) {
                // simplifiedActions.push({ action: 'LEVER_OUTIL' }); // Optionnel
                isToolDown = false;
              }
              if (currentPosition.x !== targetX || currentPosition.y !== targetY) {
                  const vector = calculateVector(currentPosition.x, currentPosition.y, targetX, targetY);
                  rotationAngle = vector.angle - currentAngle;
                  distanceToMove = vector.distance;

                  if (Math.abs(rotationAngle) > 0.001) {
                    simplifiedActions.push({ action: 'PLIER', valeur: parseFloat(rotationAngle.toFixed(2)) });
                    currentAngle += rotationAngle;
                  }
                  if (distanceToMove > 0.001) {
                    simplifiedActions.push({ action: 'AVANCER', valeur: parseFloat(distanceToMove.toFixed(3)) });
                  }
              }
              currentPosition.x = targetX;
              currentPosition.y = targetY;
              pathStartPoint = { ...currentPosition };
              // On considère que l'outil s'abaisse après un M pour commencer à dessiner
              // simplifiedActions.push({ action: 'ABAISSER_OUTIL' }); // Optionnel
              isToolDown = true;
              break;

            case 'L': // Lineto (absolute)
            case 'H': // Horizontal lineto (absolute)
            case 'V': // Vertical lineto (absolute)
              if (!isToolDown) { // Si l'outil était levé, on le baisse (implicite pour L,H,V après M)
                // simplifiedActions.push({ action: 'ABAISSER_OUTIL' }); // Optionnel
                isToolDown = true;
              }
              const vectorLHV = calculateVector(currentPosition.x, currentPosition.y, targetX, targetY);
              rotationAngle = vectorLHV.angle - currentAngle;
              distanceToMove = vectorLHV.distance;

              if (Math.abs(rotationAngle) > 0.001) {
                simplifiedActions.push({ action: 'PLIER', valeur: parseFloat(rotationAngle.toFixed(2)) });
                currentAngle += rotationAngle;
              }
              if (distanceToMove > 0.001) {
                simplifiedActions.push({ action: 'AVANCER', valeur: parseFloat(distanceToMove.toFixed(3)) });
              }
              currentPosition.x = targetX;
              currentPosition.y = targetY;
              break;

            case 'C': // Curveto (absolute) - Approximation: ligne droite vers le point final
              if (!isToolDown) {
                // simplifiedActions.push({ action: 'ABAISSER_OUTIL' }); // Optionnel
                isToolDown = true;
              }
              console.log(`[Path Processor] Courbe C de (${currentPosition.x.toFixed(2)},${currentPosition.y.toFixed(2)}) à (${targetX.toFixed(2)},${targetY.toFixed(2)}) via (${cmd.x1.toFixed(2)},${cmd.y1.toFixed(2)}) et (${cmd.x2.toFixed(2)},${cmd.y2.toFixed(2)}) - APPROXIMÉE PAR LIGNE DROITE`);
              const vectorC = calculateVector(currentPosition.x, currentPosition.y, targetX, targetY);
              rotationAngle = vectorC.angle - currentAngle;
              distanceToMove = vectorC.distance;

              if (Math.abs(rotationAngle) > 0.001) {
                simplifiedActions.push({ action: 'PLIER', valeur: parseFloat(rotationAngle.toFixed(2)) });
                currentAngle += rotationAngle;
              }
              if (distanceToMove > 0.001) {
                simplifiedActions.push({ action: 'AVANCER', valeur: parseFloat(distanceToMove.toFixed(3)) });
              }
              currentPosition.x = targetX;
              currentPosition.y = targetY;
              break;

            case 'Z': case 'z': // Closepath
              if (currentPosition.x !== pathStartPoint.x || currentPosition.y !== pathStartPoint.y) {
                if (!isToolDown) {
                  // simplifiedActions.push({ action: 'ABAISSER_OUTIL' }); // Optionnel
                  isToolDown = true;
                }
                const vectorZ = calculateVector(currentPosition.x, currentPosition.y, pathStartPoint.x, pathStartPoint.y);
                rotationAngle = vectorZ.angle - currentAngle;
                distanceToMove = vectorZ.distance;

                if (Math.abs(rotationAngle) > 0.001) {
                  simplifiedActions.push({ action: 'PLIER', valeur: parseFloat(rotationAngle.toFixed(2)) });
                  currentAngle += rotationAngle;
                }
                if (distanceToMove > 0.001) {
                  simplifiedActions.push({ action: 'AVANCER', valeur: parseFloat(distanceToMove.toFixed(3)) });
                }
              }
              currentPosition = { ...pathStartPoint };
              // L'outil reste généralement baissé après un Z si on continue un autre sous-chemin
              break;

            default:
              console.log(`[Path Processor] Commande SVG non gérée ou non pertinente pour la simplification: ${cmd.code}`);
          }
        }
        if (isToolDown) {
            // Peut-être lever l'outil à la fin d'un chemin ? Ou laisser la machine le gérer.
            // simplifiedActions.push({ action: 'LEVER_OUTIL', note: 'Fin du chemin' });
            isToolDown = false; // Prêt pour un nouveau M potentiellement
        }
      } catch (parseError) {
        console.error(`[Path Processor] Erreur de parsing du chemin: ${pathData}`, parseError);
        simplifiedActions.push({ action: 'ERREUR_PARSING_CHEMIN', details: parseError.message });
      }
    }
    
    // Fonction récursive pour trouver et traiter les éléments SVG
    function findAndProcessElements(element) {
        if (!element || typeof element !== 'object') return;
        const elementName = element['#name'];

        if (elementName) {
            const elNameLower = elementName.toLowerCase();
            if (elNameLower === 'path' && element.$ && element.$.d) {
                processPathCommands(element.$.d);
            }
            else if (elNameLower === 'line' && element.$ && element.$.x1 && element.$.y1 && element.$.x2 && element.$.y2) {
                const d = `M ${element.$.x1} ${element.$.y1} L ${element.$.x2} ${element.$.y2}`;
                console.log(`[SVG Element] Ligne convertie en chemin: ${d}`);
                processPathCommands(d);
            }
            else if (elNameLower === 'rect' && element.$ && element.$.x && element.$.y && element.$.width && element.$.height) {
                const x = parseFloat(element.$.x), y = parseFloat(element.$.y);
                const width = parseFloat(element.$.width), height = parseFloat(element.$.height);
                const d = `M ${x} ${y} L ${x+width} ${y} L ${x+width} ${y+height} L ${x} ${y+height} Z`;
                console.log(`[SVG Element] Rectangle converti en chemin: ${d}`);
                processPathCommands(d);
            }
            else if ((elNameLower === 'polygon' || elNameLower === 'polyline') && element.$ && element.$.points) {
                const rawPointsString = element.$.points;
                console.log(`[SVG Element] ${elNameLower} - Attribut points brut: "${rawPointsString}"`);
                
                // Tentative de nettoyage plus robuste des points : supprimer les virgules, puis diviser par les espaces
                const cleanedPointsString = rawPointsString.replace(/,/g, ' ').trim(); // Remplacer virgules par espace, puis trim
                const pointsStrArray = cleanedPointsString.split(/\s+/); // Diviser par un ou plusieurs espaces
                
                console.log(`[SVG Element] ${elNameLower} - Points après split par espace:`, pointsStrArray);

                const pointsArray = pointsStrArray.map(Number).filter(n => !isNaN(n)); // Convertir en nombre ET filtrer les NaN
                
                console.log(`[SVG Element] ${elNameLower} - Points convertis en nombres (filtrés):`, pointsArray);
                console.log(`[SVG Element] ${elNameLower} - Nombre de coordonnées numériques: ${pointsArray.length}`);

                if (pointsArray.length >= 2 && pointsArray.length % 2 === 0) {
                    let d = `M ${pointsArray[0]} ${pointsArray[1]}`;
                    for (let i = 2; i < pointsArray.length; i += 2) {
                        d += ` L ${pointsArray[i]} ${pointsArray[i+1]}`;
                    }
                    if (elNameLower === 'polygon') {
                        d += ' Z';
                    }
                    console.log(`[SVG Element DEBUG] ${elNameLower} - Chemin 'd' généré AVANT processPathCommands: "${d}"`);
                    processPathCommands(d);
                } else {
                    console.warn(`[SVG Element] ${elNameLower} a un nombre de points invalide ou insuffisant après parsing. Coordonnées trouvées: ${pointsArray.length}. Points bruts: "${rawPointsString}"`);
                }
            }
            // TODO: Gérer <circle>, <ellipse>
        }

        if (element.$$) { // Explorer les enfants
            for (const childKey in element.$$) {
                const children = Array.isArray(element.$$[childKey]) ? element.$$[childKey] : [element.$$[childKey]];
                children.forEach(childNode => {
                    if (typeof childNode === 'object' && childNode !== null) {
                        childNode['#name'] = childNode['#name'] || childKey;
                    }
                    findAndProcessElements(childNode);
                });
            }
        }
    }

    findAndProcessElements(parsedSvg.svg);

    // Action finale de COUPE si des actions ont été générées
    if (simplifiedActions.length > 0 && simplifiedActions.some(act => act.action === 'AVANCER')) {
        simplifiedActions.push({ action: 'COUPER' });
    }

  } catch (error) {
    console.error("[SVG Service] Erreur lors de la transformation SVG:", error);
    simplifiedActions.push({ action: 'ERREUR_GENERALE', details: error.message });
  }

  console.log("Actions simplifiées générées (fin).");
  return simplifiedActions;
}

module.exports = {
  transformSVGToActions,
}; 