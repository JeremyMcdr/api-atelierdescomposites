const path = require('path');
const fs = require('fs');

/**
 * Contrôleur pour la gestion de la bibliothèque de pièces SVG
 * Permet de sauvegarder, récupérer et gérer les pièces SVG
 */

// Répertoire de stockage des pièces SVG
const svgLibraryDir = path.join(__dirname, '../svg_library');

// Assurer que le répertoire existe
if (!fs.existsSync(svgLibraryDir)) {
  fs.mkdirSync(svgLibraryDir, { recursive: true });
  console.log(`Répertoire de bibliothèque SVG créé: ${svgLibraryDir}`);
} else {
  console.log(`Répertoire de bibliothèque SVG existant: ${svgLibraryDir}`);
}

// Fichier JSON pour stocker les métadonnées des pièces
const metadataFilePath = path.join(svgLibraryDir, 'pieces_metadata.json');

// Charger ou initialiser les métadonnées
let piecesMetadata = [];
try {
  if (fs.existsSync(metadataFilePath)) {
    piecesMetadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
    console.log(`Métadonnées chargées: ${piecesMetadata.length} pièces trouvées`);
  } else {
    console.log('Aucun fichier de métadonnées trouvé, initialisation d\'un nouveau fichier');
    // Création d'un fichier de métadonnées vide
    fs.writeFileSync(metadataFilePath, JSON.stringify([], null, 2));
  }
} catch (error) {
  console.error('Erreur lors du chargement des métadonnées:', error.message);
}

/**
 * Sauvegarde les métadonnées dans le fichier JSON
 * @private
 */
const saveMetadata = () => {
  try {
    fs.writeFileSync(metadataFilePath, JSON.stringify(piecesMetadata, null, 2));
    console.log(`Métadonnées sauvegardées: ${piecesMetadata.length} pièces`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des métadonnées:', error.message);
  }
};

/**
 * Sauvegarde une pièce SVG
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.savePiece = (req, res) => {
  const { name, svgContent, description, tags } = req.body;
  
  // Validation des données
  if (!name || !svgContent) {
    return res.status(400).json({
      success: false,
      message: 'Le nom et le contenu SVG sont requis'
    });
  }
  
  try {
    // Génération d'un ID unique
    const pieceId = `piece_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const fileName = `${pieceId}.svg`;
    const filePath = path.join(svgLibraryDir, fileName);
    
    // Écriture du fichier SVG
    fs.writeFileSync(filePath, svgContent);
    
    // Création des métadonnées
    const pieceMetadata = {
      id: pieceId,
      name,
      description: description || '',
      tags: tags || [],
      fileName,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Ajout aux métadonnées
    piecesMetadata.push(pieceMetadata);
    saveMetadata();
    
    console.log(`Nouvelle pièce sauvegardée: ${name} (${pieceId})`);
    
    res.status(201).json({
      success: true,
      message: 'Pièce sauvegardée avec succès',
      piece: pieceMetadata
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la pièce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde de la pièce',
      error: error.message
    });
  }
};

/**
 * Récupère toutes les pièces SVG
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getAllPieces = (req, res) => {
  try {
    // Trier les pièces par date de création (plus récentes en premier)
    const sortedPieces = [...piecesMetadata].sort((a, b) => b.createdAt - a.createdAt);
    
    res.status(200).json({
      success: true,
      count: sortedPieces.length,
      pieces: sortedPieces
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des pièces:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des pièces',
      error: error.message
    });
  }
};

/**
 * Récupère le contenu d'une pièce SVG spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getPieceContent = (req, res) => {
  const { pieceId } = req.params;
  
  try {
    // Recherche de la pièce dans les métadonnées
    const pieceMetadata = piecesMetadata.find(piece => piece.id === pieceId);
    
    if (!pieceMetadata) {
      return res.status(404).json({
        success: false,
        message: `Aucune pièce trouvée avec l'ID ${pieceId}`
      });
    }
    
    const filePath = path.join(svgLibraryDir, pieceMetadata.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: `Le fichier SVG pour la pièce ${pieceId} est introuvable`
      });
    }
    
    const svgContent = fs.readFileSync(filePath, 'utf8');
    
    res.status(200).json({
      success: true,
      piece: {
        ...pieceMetadata,
        svgContent
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu de la pièce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contenu de la pièce',
      error: error.message
    });
  }
};

/**
 * Supprime une pièce SVG
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.deletePiece = (req, res) => {
  const { pieceId } = req.params;
  
  try {
    // Recherche de la pièce dans les métadonnées
    const pieceIndex = piecesMetadata.findIndex(piece => piece.id === pieceId);
    
    if (pieceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Aucune pièce trouvée avec l'ID ${pieceId}`
      });
    }
    
    const pieceMetadata = piecesMetadata[pieceIndex];
    const filePath = path.join(svgLibraryDir, pieceMetadata.fileName);
    
    // Supprimer le fichier SVG s'il existe
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Supprimer la pièce des métadonnées
    piecesMetadata.splice(pieceIndex, 1);
    saveMetadata();
    
    console.log(`Pièce supprimée: ${pieceMetadata.name} (${pieceId})`);
    
    res.status(200).json({
      success: true,
      message: 'Pièce supprimée avec succès',
      deletedPiece: pieceMetadata
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la pièce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la pièce',
      error: error.message
    });
  }
}; 