// Configuration API selon l'environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URL de base de l'API selon l'environnement
export const API_BASE_URL = (() => {
  if (isDevelopment && isLocalhost) {
    // Développement local - utiliser le proxy
    return '/api';
  } else {
    // Production - utiliser l'API Vercel
    return 'https://scout-interest-optimized-a9fxapxv5-angelo-geracis-projects.vercel.app/api';
  }
})();

// Configuration des timeouts et retry
export const API_CONFIG = {
  timeout: 30000, // 30 secondes
  retryAttempts: 3,
  retryDelay: 1000, // 1 seconde
};

// Log de la configuration
console.log('🔧 Configuration API:', {
  environment: process.env.NODE_ENV,
  isLocalhost,
  apiBaseUrl: API_BASE_URL,
  timestamp: new Date().toISOString()
});

export default API_BASE_URL;

