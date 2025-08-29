// Configuration des limitations Meta API
const RATE_LIMITS = {
  // Environnements basés sur la documentation officielle Meta
  environments: {
    development: {
      name: 'Development Tier',
      description: 'Marketing API Development tier (Standard Access)',
      tier: 'development',
      maxScore: 60,
      decayRate: 300, // 5 minutes
      reachEstimate: {
        callsPerMinute: 1, // Très conservateur pour dev
        callsPerHour: 300, // Limite ads_management dev tier
        maxConcurrent: 1,
        minTimeBetweenCalls: 60000, // 1 minute entre les appels
        pointsPerCall: 1 // Read operation
      },
      search: {
        callsPerMinute: 1,
        callsPerHour: 300,
        maxConcurrent: 1,
        minTimeBetweenCalls: 60000, // 1 minute entre les appels
        pointsPerCall: 1 // Read operation
      }
    },
    production: {
      name: 'Standard Tier',
      description: 'Marketing API Standard tier (Advanced Access)',
      tier: 'standard',
      maxScore: 9000,
      decayRate: 300, // 5 minutes
      reachEstimate: {
        callsPerMinute: 1500, // 90,000/heure (conservateur)
        callsPerHour: 90000,
        maxConcurrent: 25,
        minTimeBetweenCalls: 40, // 40ms entre les appels
        pointsPerCall: 1 // Read operation
      },
      search: {
        callsPerMinute: 1500,
        callsPerHour: 90000,
        maxConcurrent: 25,
        minTimeBetweenCalls: 40, // 40ms entre les appels
        pointsPerCall: 1 // Read operation
      }
    },
    aggressive: {
      name: 'Aggressive (Standard Tier)',
      description: 'Mode agressif pour Standard tier (risque de rate limiting)',
      tier: 'standard',
      maxScore: 9000,
      decayRate: 300,
      reachEstimate: {
        callsPerMinute: 2500, // 150,000/heure
        callsPerHour: 150000,
        maxConcurrent: 50,
        minTimeBetweenCalls: 24, // 24ms entre les appels
        pointsPerCall: 1
      },
      search: {
        callsPerMinute: 2500,
        callsPerHour: 150000,
        maxConcurrent: 50,
        minTimeBetweenCalls: 24, // 24ms entre les appels
        pointsPerCall: 1
      }
    },
    conservative: {
      name: 'Conservative (Standard Tier)',
      description: 'Mode conservateur pour Standard tier',
      tier: 'standard',
      maxScore: 9000,
      decayRate: 300,
      reachEstimate: {
        callsPerMinute: 800, // 48,000/heure
        callsPerHour: 48000,
        maxConcurrent: 15,
        minTimeBetweenCalls: 75, // 75ms entre les appels
        pointsPerCall: 1
      },
      search: {
        callsPerMinute: 800,
        callsPerHour: 48000,
        maxConcurrent: 15,
        minTimeBetweenCalls: 75, // 75ms entre les appels
        pointsPerCall: 1
      }
    }
  },

  // Configuration par défaut
  defaultEnvironment: 'production',

  // Batch sizes optimisés selon l'environnement et les vraies limitations
  batchSizes: {
    development: {
      small: 1,    // 1-5 codes (très conservateur)
      medium: 2,   // 6-20 codes
      large: 3,    // 21-100 codes
      xlarge: 5    // 100+ codes
    },
    production: {
      small: 5,    // 1-20 codes
      medium: 15,  // 21-100 codes
      large: 30,   // 101-500 codes
      xlarge: 60   // 500+ codes
    },
    aggressive: {
      small: 10,   // 1-50 codes
      medium: 25,  // 51-200 codes
      large: 50,   // 201-1000 codes
      xlarge: 100  // 1000+ codes
    },
    conservative: {
      small: 3,    // 1-10 codes
      medium: 8,   // 11-50 codes
      large: 15,   // 51-200 codes
      xlarge: 30   // 200+ codes
    }
  },

  // Délais entre les batches basés sur les vraies limitations
  batchDelays: {
    development: {
      minDelay: 60000,   // 1 minute (très conservateur)
      delayPerCode: 120000 // 2 minutes par code
    },
    production: {
      minDelay: 2000,    // 2 secondes
      delayPerCode: 100  // 100ms par code
    },
    aggressive: {
      minDelay: 1000,    // 1 seconde
      delayPerCode: 50   // 50ms par code
    },
    conservative: {
      minDelay: 5000,    // 5 secondes
      delayPerCode: 200  // 200ms par code
    }
  }
};

// Fonction pour obtenir la configuration d'un environnement
function getEnvironmentConfig(environment = null) {
  const env = environment || process.env.META_API_ENVIRONMENT || RATE_LIMITS.defaultEnvironment;
  return RATE_LIMITS.environments[env] || RATE_LIMITS.environments[RATE_LIMITS.defaultEnvironment];
}

// Fonction pour obtenir la taille de batch optimisée
function getBatchSize(environment, totalCodes) {
  const env = environment || process.env.META_API_ENVIRONMENT || RATE_LIMITS.defaultEnvironment;
  const batchConfig = RATE_LIMITS.batchSizes[env] || RATE_LIMITS.batchSizes[RATE_LIMITS.defaultEnvironment];
  
  if (totalCodes <= 10) return batchConfig.small;
  if (totalCodes <= 50) return batchConfig.medium;
  if (totalCodes <= 200) return batchConfig.large;
  return batchConfig.xlarge;
}

// Fonction pour obtenir le délai entre batches
function getBatchDelay(environment, batchSize) {
  const env = environment || process.env.META_API_ENVIRONMENT || RATE_LIMITS.defaultEnvironment;
  const delayConfig = RATE_LIMITS.batchDelays[env] || RATE_LIMITS.batchDelays[RATE_LIMITS.defaultEnvironment];
  
  return Math.max(delayConfig.minDelay, batchSize * delayConfig.delayPerCode);
}

// Fonction pour estimer le temps de traitement
function estimateProcessingTime(environment, totalCodes) {
  const env = environment || process.env.META_API_ENVIRONMENT || RATE_LIMITS.defaultEnvironment;
  const config = getEnvironmentConfig(env);
  const batchSize = getBatchSize(env, totalCodes);
  const batches = Math.ceil(totalCodes / batchSize);
  
  // Temps par batch (recherche + reach estimate)
  const timePerBatch = (config.search.minTimeBetweenCalls + config.reachEstimate.minTimeBetweenCalls) * batchSize;
  const totalTime = batches * timePerBatch;
  
  return {
    estimatedMinutes: Math.ceil(totalTime / 60000),
    estimatedSeconds: Math.ceil(totalTime / 1000),
    batches,
    batchSize,
    timePerBatch
  };
}

// Fonction pour valider les paramètres selon la documentation Meta
function validateRateLimitConfig(config) {
  const errors = [];
  
  if (!config.reachEstimate || !config.search) {
    errors.push('Configuration incomplète: reachEstimate et search requis');
  }
  
  // Validation selon les vraies limitations Meta
  if (config.tier === 'development') {
    if (config.reachEstimate.callsPerHour > 300) {
      errors.push('Attention: Development tier limité à 300 appels/heure pour ads_management');
    }
    if (config.maxScore > 60) {
      errors.push('Attention: Development tier limité à 60 points max');
    }
  } else if (config.tier === 'standard') {
    if (config.reachEstimate.callsPerHour > 100000) {
      errors.push('Attention: Standard tier limité à 100,000 appels/heure pour ads_management');
    }
    if (config.maxScore > 9000) {
      errors.push('Attention: Standard tier limité à 9000 points max');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Fonction pour gérer les erreurs de rate limiting selon la documentation Meta
function handleRateLimitError(error, environment) {
  const config = getEnvironmentConfig(environment);
  
  // Erreurs spécifiques selon la documentation
  if (error.code === 17 && error.error_subcode === 2446079) {
    return {
      type: 'ad_account_level',
      message: 'User request limit reached',
      waitTime: config.decayRate,
      action: 'wait_and_retry'
    };
  }
  
  if (error.code === 613 && error.error_subcode === 1487742) {
    return {
      type: 'ad_account_level',
      message: 'Too many calls from this ad-account',
      waitTime: 60, // 60 secondes selon la doc
      action: 'wait_and_retry'
    };
  }
  
  if (error.code === 4 && (error.error_subcode === 1504022 || error.error_subcode === 1504039)) {
    return {
      type: 'app_level',
      message: 'Too many calls from this app',
      waitTime: 300, // 5 minutes
      action: 'scale_back_calls'
    };
  }
  
  if (error.code === 80000 || error.code === 80003 || error.code === 80004 || error.code === 80014) {
    return {
      type: 'business_use_case',
      message: 'Business use case rate limit exceeded',
      waitTime: config.decayRate,
      action: 'scale_back_changes'
    };
  }
  
  // Erreur générique
  return {
    type: 'unknown',
    message: error.message || 'Unknown rate limiting error',
    waitTime: config.decayRate,
    action: 'investigate_and_contact_support'
  };
}

module.exports = {
  RATE_LIMITS,
  getEnvironmentConfig,
  getBatchSize,
  getBatchDelay,
  estimateProcessingTime,
  validateRateLimitConfig,
  handleRateLimitError
};
