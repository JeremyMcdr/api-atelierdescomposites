const express = require('express');
const directUploadController = require('../controllers/directUploadController');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Route pour uploader un SVG et le convertir directement en séquence d'actions
router.post('/svg-to-sequence', upload.single('svgfile'), directUploadController.uploadAndConvert);

module.exports = router; 