const express = require('express');
const productionJobController = require('../controllers/productionJobController');

const router = express.Router();

// Route pour récupérer la séquence d'un job de production par son ID
router.get('/:jobId/sequence', productionJobController.getSequenceByJobId);

module.exports = router; 