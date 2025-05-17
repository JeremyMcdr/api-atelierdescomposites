/**
 * Middleware de gestion des erreurs
 * Capture les erreurs et renvoie une réponse appropriée au client
 */

/**
 * Middleware qui intercepte les erreurs survenues dans l'application
 * et renvoie une réponse JSON formatée au client
 */
const errorMiddleware = (err, req, res, next) => {
  // Journalisation de l'erreur pour le débogage
  console.error('Erreur interceptée par le middleware :', err);
  
  // Status HTTP par défaut pour les erreurs
  let statusCode = err.statusCode || 500;
  
  // Message d'erreur adapté au client
  let errorMessage = err.message || 'Une erreur interne est survenue';
  
  // En mode production, ne pas exposer les détails techniques des erreurs
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && statusCode === 500) {
    errorMessage = 'Une erreur interne est survenue';
  }
  
  // Construction de la réponse
  const errorResponse = {
    success: false,
    error: {
      message: errorMessage,
      status: statusCode
    }
  };
  
  // Inclure la stack trace en développement
  if (!isProduction) {
    errorResponse.error.stack = err.stack;
    
    // Inclure des détails supplémentaires si disponibles
    if (err.details) {
      errorResponse.error.details = err.details;
    }
  }
  
  // Envoyer la réponse JSON
  res.status(statusCode).json(errorResponse);
};

module.exports = errorMiddleware; 