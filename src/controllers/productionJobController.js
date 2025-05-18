const productionJobService = require('../services/productionJobService');

exports.getSequenceByJobId = async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    return res.status(400).json({
      success: false,
      message: 'Job ID manquant.'
    });
  }

  try {
    const sequence = productionJobService.getJobSequence(jobId);

    if (sequence) {
      res.status(200).json({
        success: true,
        jobId: jobId,
        actions: sequence
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Séquence non trouvée pour le job ID: ${jobId}`
      });
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de la séquence pour le job ID ${jobId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la séquence.',
      errorDetails: error.message
    });
  }
}; 