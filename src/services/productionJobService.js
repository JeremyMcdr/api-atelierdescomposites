const fs = require('fs');
const path = require('path');

const productionJobStore = {};
const sequencesDir = path.join(__dirname, '../generated_sequences'); // Define sequencesDir

// Assurer que le dossier des séquences existe (au cas où)
if (!fs.existsSync(sequencesDir)) {
  fs.mkdirSync(sequencesDir, { recursive: true });
}

function storeJobSequence(jobId, sequence) {
  if (!jobId) {
    console.warn("Attempted to store sequence without jobId");
    return;
  }
  productionJobStore[jobId] = sequence;
  console.log(`Sequence for job ${jobId} stored in memory.`);
  
  // Optionnel: Écrire aussi sur disque ici si ce n'est pas déjà fait ailleurs,
  // ou si on veut s'assurer que la version en mémoire est prioritaire et écrite.
  // Pour l'instant, directUploadController gère l'écriture initiale.
}

function getJobSequence(jobId) {
  if (!jobId) return null;

  // 1. Vérifier dans le cache mémoire
  if (productionJobStore[jobId]) {
    console.log(`Sequence for job ${jobId} retrieved from memory.`);
    return productionJobStore[jobId];
  }

  // 2. Si non trouvé en mémoire, essayer de charger depuis le fichier
  const sequenceFilePath = path.join(sequencesDir, `${jobId}.json`);
  if (fs.existsSync(sequenceFilePath)) {
    try {
      const sequenceData = fs.readFileSync(sequenceFilePath, 'utf8');
      const sequence = JSON.parse(sequenceData);
      // Mettre en cache pour les accès futurs
      productionJobStore[jobId] = sequence;
      console.log(`Sequence for job ${jobId} loaded from file and cached.`);
      return sequence;
    } catch (error) {
      console.error(`Error reading or parsing sequence file for job ${jobId}:`, error);
      return null; // Erreur de lecture ou parsing
    }
  }

  console.log(`Sequence for job ${jobId} not found in memory or on disk.`);
  return null; // Non trouvé
}

module.exports = {
  storeJobSequence,
  getJobSequence,
}; 