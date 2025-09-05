const metaApi = require('../config/meta-api');
const Bottleneck = require('bottleneck');
const { getEnvironmentConfig, getBatchSize, getBatchDelay, estimateProcessingTime, handleRateLimitError } = require('../config/rateLimits');

class ParallelProcessorOptimized {
  constructor(environment = null) {
    this.environment = environment || process.env.META_API_ENVIRONMENT || 'production';
    this.config = getEnvironmentConfig(this.environment);
    
    console.log(`🚀 Initializing OptimizedProcessor with environment: ${this.environment}`);

    // Utiliser l'instance Meta API existante
    this.metaApi = metaApi;
    
    if (!this.metaApi.isConfigured) {
      console.error('❌ Meta API non configurée - Impossible de traiter les codes postaux sans clés Meta API valides');
      throw new Error('Meta API not configured. Cannot process postal codes without valid Meta API credentials.');
    }

    this.rateLimiter = new Bottleneck({
      maxConcurrent: this.config.reachEstimate.maxConcurrent,
      minTime: this.config.reachEstimate.minTimeBetweenCalls,
      reservoir: this.config.reachEstimate.callsPerMinute,
      reservoirRefreshAmount: this.config.reachEstimate.callsPerMinute,
      reservoirRefreshInterval: 60 * 1000,
    });

    this.searchLimiter = new Bottleneck({
      maxConcurrent: this.config.search.maxConcurrent,
      minTime: this.config.search.minTimeBetweenCalls,
      reservoir: this.config.search.callsPerMinute,
      reservoirRefreshAmount: this.config.search.callsPerMinute,
      reservoirRefreshInterval: 60 * 1000,
    });

    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 heures
    
    this.stats = {
      totalCalls: 0,
      errors: 0,
      rateLimitErrors: 0,
      cacheHits: 0,
      successfulRequests: 0,
      startTime: Date.now()
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.rateLimiter.on('error', (error) => {
      console.error('Rate limiter error:', error);
      this.stats.errors++;
    });

    this.rateLimiter.on('depleted', () => {
      console.warn('⚠️ Rate limiter depleted, waiting for refresh...');
    });
  }

  getCacheKey(postalCode, countryCode, targetingSpec) {
    return `${postalCode}_${countryCode}_${JSON.stringify(targetingSpec)}`;
  }

  isValidCacheEntry(entry) {
    return entry && entry.timestamp && (Date.now() - entry.timestamp < this.cacheExpiry);
  }

  async processPostalCodeBatch(postalCodes, countryCode, targetingSpec, projectId, onProgress) {
    console.log(`📦 Processing batch of ${postalCodes.length} postal codes for ${countryCode}`);
    
    const batchSize = getBatchSize(this.environment);
    const batchDelay = getBatchDelay(this.environment);
    const batches = [];
    
    for (let i = 0; i < postalCodes.length; i += batchSize) {
      batches.push(postalCodes.slice(i, i + batchSize));
    }

    const allResults = [];
    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📊 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} codes)`);

      try {
        const batchPromises = batch.map(postalCode => 
          this.processPostalCodeWithRetry(postalCode, countryCode, targetingSpec, projectId)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allResults.push(result.value);
            this.stats.successfulRequests++;
          } else {
            console.error(`Error processing ${batch[index]}:`, result.reason);
            allResults.push({
              postal_code: batch[index],
              success: false,
              error: result.reason.message || 'Unknown error',
              audience_estimate: 0
            });
            this.stats.errors++;
          }
        });

        processedCount += batch.length;

        if (onProgress) {
          onProgress({
            processed: processedCount,
            total: postalCodes.length,
            percentage: Math.round((processedCount / postalCodes.length) * 100),
            currentBatch: batchIndex + 1,
            totalBatches: batches.length
          });
        }

        // Délai entre les batches pour respecter les limites
        if (batchIndex < batches.length - 1) {
          console.log(`⏳ Waiting ${batchDelay}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }

      } catch (error) {
        console.error(`Batch ${batchIndex + 1} failed:`, error);
        // Ajouter les codes postaux du batch échoué comme erreurs
        batch.forEach(postalCode => {
          allResults.push({
            postal_code: postalCode,
            success: false,
            error: error.message || 'Batch processing failed',
            audience_estimate: 0
          });
        });
        this.stats.errors += batch.length;
      }
    }

    return allResults;
  }

  async processPostalCodeWithRetry(postalCode, countryCode, targetingSpec, projectId, maxRetries = 3) {
    const cacheKey = this.getCacheKey(postalCode, countryCode, targetingSpec);
    const cachedResult = this.cache.get(cacheKey);

    if (this.isValidCacheEntry(cachedResult)) {
      console.log(`💾 Cache hit for ${postalCode}`);
      this.stats.cacheHits++;
      return cachedResult.data;
    }

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.rateLimiter.schedule(() => 
          this.processPostalCode(postalCode, countryCode, targetingSpec, projectId)
        );
        
        // Mettre en cache le résultat réussi
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${postalCode}:`, error.message);
        
        if (this.isRateLimitError(error)) {
          this.stats.rateLimitErrors++;
          const waitTime = this.getRetryDelay(attempt);
          console.log(`🔄 Rate limit hit, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt === maxRetries) {
          break;
        }
      }
    }

    throw lastError;
  }

  async processPostalCode(postalCode, countryCode, targetingSpec, projectId) {
    this.stats.totalCalls++;
    
    try {
      // 1. D'abord chercher le code postal pour obtenir sa clé valide
      if (!this.metaApi.api) {
        throw new Error('Meta API not available - no access token');
      }
      
      const searchResponse = await this.metaApi.api.call(
        'GET',
        ['search'],
        {
          type: 'adgeolocation',
          location_types: JSON.stringify(['zip']),
          q: postalCode,
          country_code: countryCode,
          limit: 1,
          access_token: process.env.META_ACCESS_TOKEN
        }
      );

      if (!searchResponse.data || searchResponse.data.length === 0) {
        throw new Error(`Code postal ${postalCode} non trouvé dans ${countryCode}`);
      }

      const zipCodeData = searchResponse.data[0];
      console.log(`✅ Code postal trouvé: ${zipCodeData.name} (${zipCodeData.key})`);

      // 2. Créer le targeting avec la clé valide du code postal
      const targeting = {
        ...targetingSpec,
        geo_locations: {
          zips: [{
            key: zipCodeData.key,
            name: zipCodeData.name,
            country_code: zipCodeData.country_code
          }]
        }
      };

      // 3. Obtenir l'estimation d'audience
      const response = await metaApi.api.call(
        'GET',
        ['act_379481728925498', 'reachestimate'],
        {
          targeting_spec: JSON.stringify(targeting),
          optimization_goal: 'REACH',
          access_token: process.env.META_ACCESS_TOKEN
        }
      );
      
      if (response && response.data && (response.data.users_lower_bound || response.data.users_upper_bound)) {
        return {
          postal_code: postalCode,
          success: true,
          audience_estimate: parseInt(response.data.users_lower_bound || response.data.users_upper_bound, 10) || 0,
          targeting_spec: targeting,
          processed_at: new Date().toISOString()
        };
      }

      throw new Error('Invalid response from Meta API');
    } catch (error) {
      console.error(`❌ Error processing ${postalCode}:`, error.message);
      throw error;
    }
  }

  isRateLimitError(error) {
    return error.code === 17 || 
           error.code === 613 || 
           error.message?.includes('rate limit') ||
           error.message?.includes('User request limit reached');
  }

  getRetryDelay(attempt) {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff max 30s
  }

  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    const runtimeMinutes = runtime / (1000 * 60);
    
    return {
      ...this.stats,
      runtime: runtime,
      runtimeMinutes: Math.round(runtimeMinutes * 100) / 100,
      requestsPerMinute: runtimeMinutes > 0 ? Math.round(this.stats.totalCalls / runtimeMinutes) : 0,
      successRate: this.stats.totalCalls > 0 ? 
        Math.round((this.stats.successfulRequests / this.stats.totalCalls) * 100) : 0,
      cacheHitRate: this.stats.totalCalls > 0 ?
        Math.round((this.stats.cacheHits / this.stats.totalCalls) * 100) : 0
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  // Méthode principale pour traiter un lot de codes postaux
  async processBatch(postalCodes, countryCode, adAccountId, targetingSpec, batchSize = 5) {
    console.log(`🚀 Processing batch of ${postalCodes.length} postal codes with ParallelProcessorOptimized`);
    
    const results = [];
    const errorDetails = [];
    let successful = 0;
    let errors = 0;
    
    try {
      const batchResults = await this.processPostalCodeBatch(
        postalCodes, 
        countryCode, 
        targetingSpec, 
        null, // projectId
        (progress) => {
          console.log(`📊 Progress: ${progress.percentage}% (${progress.processed}/${progress.total})`);
        }
      );
      
      // Transformer les résultats
      batchResults.forEach(result => {
        if (result.success) {
          results.push({
            postalCode: result.postal_code,
            countryCode: countryCode,
            success: true,
            postalCodeOnlyEstimate: { audience_size: result.audience_estimate },
            postalCodeWithTargetingEstimate: { audience_size: Math.floor(result.audience_estimate * 0.1) }
          });
          successful++;
        } else {
          errorDetails.push(result);
          errors++;
        }
      });
      
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      throw error;
    }
    
    return {
      totalProcessed: postalCodes.length,
      successful,
      errors,
      results,
      errorDetails,
      rateLimitInfo: this.getStats()
    };
  }

  async cleanup() {
    console.log('🧹 Cleaning up processor...');
    await this.rateLimiter.stop();
    await this.searchLimiter.stop();
    this.clearCache();
  }
}

module.exports = ParallelProcessorOptimized;