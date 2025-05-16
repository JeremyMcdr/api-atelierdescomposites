const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');

// S'assurer que le dossier uploads existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Dossier où les fichiers seront sauvegardés
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname) || '.svg'; // S'assurer qu'il y a une extension
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtre pour n'accepter que les fichiers SVG
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/svg+xml' || file.originalname.endsWith('.svg')) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Seuls les fichiers SVG sont autorisés.'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite à 5MB
  }
});

module.exports = upload; 