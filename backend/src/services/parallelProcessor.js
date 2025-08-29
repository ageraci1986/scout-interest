const metaApi = require('../config/meta-api');
const Bottleneck = require('bottleneck');
const { getEnvironmentConfig, getBatchSize, getBatchDelay, estimateProcessingTime, handleRateLimitError } = require('../config/rateLimits');

class ParallelProcessor {
  constructor(environment = null) {
    this.environment = environment || process.env.META_API_ENVIRONMENT || 'production';
    this.config = getEnvironmentConfig(this.environment);
    
    console.log(`🚀 Initializing ParallelProcessor with environment: ${this.environment}`);
    console.log(`📊 Rate limits: ${this.config.reachEstimate.callsPerMinute}/min for reach, ${this.config.search.callsPerMinute}/min for search`);

    // Rate limiter pour respecter les limites Meta API
    this.rateLimiter = new Bottleneck({
      maxConcurrent: this.config.reachEstimate.maxConcurrent,
      minTime: this.config.reachEstimate.minTimeBetweenCalls,
      reservoir: this.config.reachEstimate.callsPerMinute, // Limite par minute
      reservoirRefreshAmount: this.config.reachEstimate.callsPerMinute, // Se recharge chaque minute
      reservoirRefreshInterval: 60 * 1000, // 1 minute
    });

    // Limiter spécifique pour l'API de recherche (plus lente)
    this.searchLimiter = new Bottleneck({
      maxConcurrent: this.config.search.maxConcurrent,
      minTime: this.config.search.minTimeBetweenCalls,
      reservoir: this.config.search.callsPerMinute, // Limite par minute
      reservoirRefreshAmount: this.config.search.callsPerMinute, // Se recharge chaque minute
      reservoirRefreshInterval: 60 * 1000, // 1 minute
    });

    // Cache pour éviter les recherches répétées
    this.postalCodeCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 heures
    
    // Monitoring des limites en temps réel
    this.rateLimitMonitor = {
      reachCallsThisMinute: 0,
      searchCallsThisMinute: 0,
      lastMinuteReset: Date.now(),
      totalCalls: 0,
      errors: 0,
      rateLimitErrors: 0,
      metaUsage: null,
      adaptiveLimits: {
        enabled: true,
        lastAdjustment: Date.now(),
        currentMultiplier: 1.0
      }
    };
    
    // Suivi du traitement en cours
    this.currentProcessing = {
      isActive: false,
      totalCodes: 0,
      processedCodes: 0,
      successfulCodes: 0,
      errorCodes: 0,
      startTime: null,
      endTime: null
    };
    
    // Émettre les mises à jour via WebSocket si disponible
    this.emitProgress = (data) => {
      if (global.io) {
        global.io.emit('processingProgress', data);
      }
    };
    
    // Reset du compteur chaque minute
    setInterval(() => {
      this.rateLimitMonitor.reachCallsThisMinute = 0;
      this.rateLimitMonitor.searchCallsThisMinute = 0;
      this.rateLimitMonitor.lastMinuteReset = Date.now();
      console.log(`🔄 Rate limit counters reset. Total calls: ${this.rateLimitMonitor.totalCalls}, Errors: ${this.rateLimitMonitor.errors}`);
      
      // Envoyer les mises à jour via WebSocket si disponible
      if (global.io) {
        global.io.emit('rateLimitUpdate', this.getRateLimitStatus());
      }
    }, 60 * 1000);
  }

  // Recherche optimisée avec cache
  async searchPostalCode(postalCode, countryCode) {
    const cacheKey = `${postalCode}_${countryCode}`;
    const cached = this.postalCodeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`📋 Cache hit for ${postalCode} in ${countryCode}`);
      return cached.data;
    }

    console.log(`🔍 Searching postal code: ${postalCode} in ${countryCode}`);
    
    try {
      const result = await this.searchLimiter.schedule(async () => {
        // Mettre à jour le monitoring
        this.rateLimitMonitor.searchCallsThisMinute++;
        this.rateLimitMonitor.totalCalls++;
        
        // Utiliser axios directement pour avoir accès aux headers
        const axios = require('axios');
        const url = `https://graph.facebook.com/v23.0/search`;
        const params = {
          type: 'adgeolocation',
          location_types: JSON.stringify(['zip']),
          q: postalCode,
          country_code: countryCode,
          limit: 1,
          access_token: process.env.META_ACCESS_TOKEN
        };

        const response = await axios.get(url, { params });
        
        // Analyser les headers de limitation Meta
        this.analyzeMetaRateLimitHeaders(response.headers, 'search');
        
        return response.data;
      });

      if (result && result.data && result.data.length > 0) {
        const zipData = result.data[0];
        this.postalCodeCache.set(cacheKey, {
          data: zipData,
          timestamp: Date.now()
        });
        return zipData;
      }
      
      return null;
          } catch (error) {
        console.error(`❌ Error searching postal code ${postalCode}:`, error.message);
        this.rateLimitMonitor.errors++;
        
        // Gestion spécifique des erreurs de rate limiting
        if (error.code === 17 || error.code === 613 || error.code === 4 || error.code === 80000) {
          this.rateLimitMonitor.rateLimitErrors++;
          const rateLimitInfo = handleRateLimitError(error, this.environment);
          console.error(`🚨 Rate limiting detected:`, rateLimitInfo);
          console.log(`📊 Current minute: ${this.rateLimitMonitor.searchCallsThisMinute}/${this.config.search.callsPerMinute} search calls`);
          
          // Attendre le temps recommandé
          console.log(`⏳ Waiting ${rateLimitInfo.waitTime} seconds due to rate limiting...`);
          await new Promise(resolve => setTimeout(resolve, rateLimitInfo.waitTime * 1000));
          
          // Retenter une fois
          console.log(`🔄 Retrying after rate limit wait...`);
          return this.searchPostalCode(postalCode, countryCode);
        }
        
        throw error;
      }
  }

    // Reach estimate optimisé avec retry intelligent
  async getReachEstimate(adAccountId, targetingSpec, retryCount = 0) {
    return this.rateLimiter.schedule(async () => {
      try {
        // Mettre à jour le monitoring
        this.rateLimitMonitor.reachCallsThisMinute++;
        this.rateLimitMonitor.totalCalls++;
        
        // Utiliser axios directement pour avoir accès aux headers
        const axios = require('axios');
        const url = `https://graph.facebook.com/v23.0/${adAccountId}/reachestimate`;
        const params = {
          targeting_spec: JSON.stringify(targetingSpec),
          optimization_goal: 'REACH',
          access_token: process.env.META_ACCESS_TOKEN
        };

        const response = await axios.get(url, { params });
        
        // Analyser les headers de limitation Meta
        this.analyzeMetaRateLimitHeaders(response.headers, 'reach');
        
        return response.data;
              } catch (error) {
          console.error(`❌ Reach estimate error:`, error.message);
          
          // Afficher plus de détails sur l'erreur 400
          if (error.response && error.response.status === 400) {
            console.error(`🔍 Error details for 400:`, {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
              url: error.config?.url,
              params: error.config?.params
            });
            
            // Vérifier si c'est une erreur de rate limiting Meta
            if (error.response.data && error.response.data.error) {
              const metaError = error.response.data.error;
              console.error(`📋 Meta API Error:`, {
                code: metaError.code,
                message: metaError.message,
                type: metaError.type,
                error_subcode: metaError.error_subcode
              });
              
              // Gestion spécifique des erreurs Meta
              if (metaError.code === 80004 || metaError.code === 17 || metaError.code === 613) {
                this.rateLimitMonitor.rateLimitErrors++;
                console.error(`🚨 Meta rate limiting detected: ${metaError.message}`);
                
                // Retry avec délai pour les erreurs de rate limiting
                if (retryCount < 3) {
                  const waitTime = Math.min(30 * (2 ** retryCount), 120); // 30s, 60s, 120s
                  console.log(`⏳ Retry ${retryCount + 1}/3: Waiting ${waitTime} seconds...`);
                  await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                  
                  return this.getReachEstimate(adAccountId, targetingSpec, retryCount + 1);
                } else {
                  throw new Error(`Meta rate limiting after ${retryCount} retries: ${metaError.message}`);
                }
              }
            }
          }
          
          this.rateLimitMonitor.errors++;
          throw error;
        }
    });
  }

  // Traitement d'un code postal complet
  async processPostalCode(postalCode, countryCode, adAccountId, targetingSpec) {
    try {
      // 1. Recherche du code postal (avec cache)
      const zipData = await this.searchPostalCode(postalCode, countryCode);
      
      if (!zipData) {
        return {
          postalCode,
          countryCode,
          success: false,
          error: `Postal code ${postalCode} not found in ${countryCode}`
        };
      }

      // 2. Création du targeting spec pour le code postal uniquement (sans targeting)
      const postalCodeOnlyTargetingSpec = {
        geo_locations: {
          zips: [{
            key: zipData.key,
            name: zipData.name,
            country_code: zipData.country_code
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: [1, 2], // Tous les genres (nombres, pas strings)
        publisher_platforms: ['audience_network', 'facebook', 'messenger', 'instagram'],
        device_platforms: ['mobile', 'desktop']
      };

      // 3. Création du targeting spec avec le code postal + targeting utilisateur
      const postalCodeWithTargetingSpec = {
        geo_locations: {
          zips: [{
            key: zipData.key,
            name: zipData.name,
            country_code: zipData.country_code
          }]
        },
        age_min: targetingSpec.age_min || 18,
        age_max: targetingSpec.age_max || 65,
        genders: [1, 2], // Toujours définir les genders correctement
        publisher_platforms: ['audience_network', 'facebook', 'messenger', 'instagram'],
        device_platforms: ['mobile', 'desktop']
      };

      // Ajouter les interestGroups si présentes dans le targetingSpec
      if (targetingSpec.interestGroups && targetingSpec.interestGroups.length > 0) {
        // Utiliser la nouvelle fonction de conversion pour les interestGroups
        const { convertInterestGroupsToMetaFormat } = require('../utils/targetingUtils');
        const convertedInterests = convertInterestGroupsToMetaFormat(targetingSpec.interestGroups);
        
        // Fusionner avec le targeting spec existant de manière plus sûre
        if (convertedInterests.interests) {
          postalCodeWithTargetingSpec.interests = convertedInterests.interests;
        }
        if (convertedInterests.flexible_spec) {
          postalCodeWithTargetingSpec.flexible_spec = convertedInterests.flexible_spec;
        }
      } else if (targetingSpec.interests && targetingSpec.interests.length > 0) {
        // Fallback pour l'ancienne structure
        postalCodeWithTargetingSpec.interests = targetingSpec.interests;
      }

      // S'assurer que les interests ont la bonne structure pour l'API Meta
      if (postalCodeWithTargetingSpec.interests) {
        postalCodeWithTargetingSpec.interests = postalCodeWithTargetingSpec.interests.map(interest => ({
          id: interest.id,
          name: interest.name
        }));
      }

      // Debug: Afficher la structure finale
      console.log(`🔍 Final targeting spec for ${postalCode}:`, JSON.stringify(postalCodeWithTargetingSpec, null, 2));





      // 4. Calcul des deux reach estimates en parallèle avec gestion d'erreur améliorée
      let postalCodeOnlyEstimate, postalCodeWithTargetingEstimate;
      
      try {
        [postalCodeOnlyEstimate, postalCodeWithTargetingEstimate] = await Promise.all([
          this.getReachEstimate(adAccountId, postalCodeOnlyTargetingSpec),
          this.getReachEstimate(adAccountId, postalCodeWithTargetingSpec)
        ]);
      } catch (error) {
        console.error(`❌ Reach estimate error:`, error.message);
        // Essayer de récupérer au moins une estimation
        try {
          postalCodeOnlyEstimate = await this.getReachEstimate(adAccountId, postalCodeOnlyTargetingSpec);
        } catch (error1) {
          console.error(`❌ Postal code only estimate failed:`, error1.message);
        }
        
        try {
          postalCodeWithTargetingEstimate = await this.getReachEstimate(adAccountId, postalCodeWithTargetingSpec);
        } catch (error2) {
          console.error(`❌ Postal code with targeting estimate failed:`, error2.message);
        }
        
        // Si les deux échouent, lever l'erreur
        if (!postalCodeOnlyEstimate && !postalCodeWithTargetingEstimate) {
          throw error;
        }
      }

      return {
        postalCode,
        countryCode,
        zipData,
        success: true,
        postalCodeOnlyEstimate,
        postalCodeWithTargetingEstimate,
        targetingSpec: postalCodeWithTargetingSpec
      };

    } catch (error) {
      console.error(`❌ Error processing postal code ${postalCode}:`, error.message);
      
      // Gestion spécifique des erreurs Meta API
      if (error.response && error.response.status === 400) {
        const metaError = error.response.data?.error;
        if (metaError) {
          console.error(`📋 Meta API Error for ${postalCode}:`, {
            code: metaError.code,
            message: metaError.message,
            type: metaError.type
          });
          
          // Gestion spécifique des erreurs de rate limiting Meta
          if (metaError.code === 80004 || metaError.code === 17 || metaError.code === 613) {
            return {
              postalCode,
              countryCode,
              success: false,
              error: `Meta rate limiting: ${metaError.message}`,
              metaError: metaError
            };
          }
          
          return {
            postalCode,
            countryCode,
            success: false,
            error: `Meta API error (${metaError.code}): ${metaError.message}`,
            metaError: metaError
          };
        }
      }
      
      // Gestion spécifique des erreurs de rate limiting
      if (error.code === 17 || error.code === 613 || error.code === 4 || error.code === 80000) {
        const rateLimitInfo = handleRateLimitError(error, this.environment);
        console.error(`🚨 Rate limiting detected during processing:`, rateLimitInfo);
        
        return {
          postalCode,
          countryCode,
          success: false,
          error: `Rate limiting: ${rateLimitInfo.message}`,
          rateLimitInfo
        };
      }
      
      return {
        postalCode,
        countryCode,
        success: false,
        error: error.message
      };
    }
  }

  // Traitement parallèle optimisé avec vraie parallélisation
  async processBatch(postalCodes, countryCode, adAccountId, targetingSpec, batchSize = 10) {
    console.log(`🚀 Starting parallel processing of ${postalCodes.length} postal codes`);
    console.log(`📊 Batch size: ${batchSize}, Concurrent: ${this.rateLimiter.maxConcurrent}`);

    // Initialiser le suivi du traitement
    this.currentProcessing = {
      isActive: true,
      totalCodes: postalCodes.length,
      processedCodes: 0,
      successfulCodes: 0,
      errorCodes: 0,
      startTime: Date.now(),
      endTime: null
    };

    const results = [];
    const errors = [];

    // Créer tous les batches en avance
    const batches = [];
    for (let i = 0; i < postalCodes.length; i += batchSize) {
      batches.push(postalCodes.slice(i, i + batchSize));
    }

    console.log(`📦 Created ${batches.length} batches of ${batchSize} codes each`);

    // Traitement parallèle de tous les batches avec limitation de concurrence
    const batchPromises = batches.map(async (batch, batchIndex) => {
      const batchNumber = batchIndex + 1;
      console.log(`📦 Starting batch ${batchNumber}/${batches.length} (${batch.length} codes)`);

      // Traitement parallèle du batch
      const batchPromises = batch.map(postalCode => 
        this.processPostalCode(postalCode, countryCode, adAccountId, targetingSpec)
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Traiter les résultats du batch
        const batchResultsData = [];
        batchResults.forEach((result, index) => {
          const postalCode = batch[index];
          
          if (result.status === 'fulfilled') {
            batchResultsData.push(result.value);
            if (result.value.success) {
              this.currentProcessing.successfulCodes++;
            } else {
              this.currentProcessing.errorCodes++;
            }
          } else {
            const errorResult = {
              postalCode,
              countryCode,
              success: false,
              error: result.reason?.message || 'Unknown error'
            };
            batchResultsData.push(errorResult);
            this.currentProcessing.errorCodes++;
          }
          
          this.currentProcessing.processedCodes++;
          
          // Émettre la progression en temps réel
          this.emitProgress({
            processed: this.currentProcessing.processedCodes,
            successful: this.currentProcessing.successfulCodes,
            errors: this.currentProcessing.errorCodes,
            total: this.currentProcessing.totalCodes,
            isProcessing: true
          });
        });

        // Log de progression du batch
        const batchProgress = ((this.currentProcessing.processedCodes / postalCodes.length) * 100).toFixed(1);
        console.log(`📊 Batch ${batchNumber} completed: ${batchProgress}% (${this.currentProcessing.processedCodes}/${postalCodes.length})`);
        console.log(`✅ Success: ${this.currentProcessing.successfulCodes}, ❌ Errors: ${this.currentProcessing.errorCodes}`);

        return { batchNumber, results: batchResultsData };

      } catch (error) {
        console.error(`❌ Error processing batch ${batchNumber}:`, error);
        // Marquer tous les codes du batch comme en erreur
        batch.forEach(postalCode => {
          errors.push({
            postalCode,
            countryCode,
            success: false,
            error: `Batch processing error: ${error.message}`
          });
          this.currentProcessing.errorCodes++;
          this.currentProcessing.processedCodes++;
        });
        
        return { batchNumber, error: error.message };
      }
    });

    // Exécuter tous les batches en parallèle avec limitation de concurrence
    console.log(`🚀 Executing ${batches.length} batches in parallel...`);
    const allBatchResults = await Promise.allSettled(batchPromises);

    // Traiter les résultats de tous les batches
    allBatchResults.forEach((batchResult, batchIndex) => {
      if (batchResult.status === 'fulfilled') {
        const batchData = batchResult.value;
        if (batchData.results) {
          // Traiter les résultats du batch
          batchData.results.forEach((result) => {
            if (result.success) {
              results.push(result);
            } else {
              errors.push(result);
            }
          });
        }
      } else {
        console.error(`❌ Batch ${batchIndex + 1} failed:`, batchResult.reason);
        // Marquer tous les codes du batch comme en erreur
        batches[batchIndex].forEach(postalCode => {
          errors.push({
            postalCode,
            countryCode,
            success: false,
            error: `Batch failed: ${batchResult.reason?.message || 'Unknown error'}`
          });
        });
      }
    });

    // Finaliser le traitement
    this.currentProcessing.isActive = false;
    this.currentProcessing.endTime = Date.now();
    
    console.log(`🎉 Parallel processing completed!`);
    console.log(`📊 Final results: ${results.length} successful, ${errors.length} errors`);

    return {
      totalProcessed: postalCodes.length,
      successful: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
      rateLimitInfo: this.getRateLimitStatus()
    };
  }

  // Analyser les headers de limitation Meta avec prédiction intelligente
  analyzeMetaRateLimitHeaders(headers, apiType) {
    try {
      // Vérifier que headers existe et n'est pas undefined
      if (!headers) {
        console.log(`⚠️ No headers received for ${apiType} API call`);
        return;
      }
      
      // Log des headers disponibles pour debug
      console.log(`🔍 Headers disponibles pour ${apiType}:`, Object.keys(headers));
      
      const metaUsage = {
        appUsage: this.parseUsageHeader(headers['x-app-usage'] || headers['X-App-Usage']),
        pageUsage: this.parseUsageHeader(headers['x-page-usage'] || headers['X-Page-Usage']),
        adAccountUsage: this.parseUsageHeader(headers['x-ad-account-usage'] || headers['X-Ad-Account-Usage']),
        businessUseCaseUsage: this.parseUsageHeader(headers['x-business-use-case-usage'] || headers['X-Business-Use-Case-Usage'])
      };

      // Analyser et prédire les limites
      const limitAnalysis = this.analyzeMetaLimits(metaUsage.businessUseCaseUsage, metaUsage.appUsage);

      // Mettre à jour le monitoring avec les vraies données Meta et l'analyse
      this.rateLimitMonitor.metaUsage = {
        ...metaUsage,
        limitAnalysis: limitAnalysis
      };
      
      // Vérifier si on approche des limites et ajuster dynamiquement
      const warnings = [];
      let shouldSlowDown = false;
      
      if (metaUsage.appUsage && metaUsage.appUsage.call_count > 0.8) {
        warnings.push(`App usage: ${Math.round(metaUsage.appUsage.call_count * 100)}%`);
        if (metaUsage.appUsage.call_count > 0.9) shouldSlowDown = true;
      }
      
      if (metaUsage.adAccountUsage && metaUsage.adAccountUsage.call_count > 0.8) {
        warnings.push(`Ad account usage: ${Math.round(metaUsage.adAccountUsage.call_count * 100)}%`);
        if (metaUsage.adAccountUsage.call_count > 0.9) shouldSlowDown = true;
      }
      
      if (warnings.length > 0) {
        console.log(`⚠️ Rate limit warnings for ${apiType}: ${warnings.join(', ')}`);
      }
      
      // Ajustement adaptatif des limites
      if (this.rateLimitMonitor.adaptiveLimits.enabled && shouldSlowDown) {
        this.adjustRateLimits(metaUsage);
      }
      
      // Log détaillé des headers (pour debug)
      console.log(`📊 Meta headers for ${apiType}:`, {
        'x-app-usage': headers['x-app-usage'] || headers['X-App-Usage'],
        'x-page-usage': headers['x-page-usage'] || headers['X-Page-Usage'],
        'x-ad-account-usage': headers['x-ad-account-usage'] || headers['X-Ad-Account-Usage'],
        'x-business-use-case-usage': headers['x-business-use-case-usage'] || headers['X-Business-Use-Case-Usage']
      });
      
    } catch (error) {
      console.error('Error parsing Meta rate limit headers:', error);
    }
  }

  // Parser les headers d'utilisation Meta
  parseUsageHeader(headerValue) {
    if (!headerValue) return null;
    
    try {
      // Format: {"call_count":0,"total_cputime":0,"total_time":0,"type":"application"}
      return JSON.parse(headerValue);
    } catch (error) {
      console.error('Error parsing usage header:', headerValue, error);
      return null;
    }
  }

  // Analyser les limites Meta et prédire quand elles seront atteintes
  analyzeMetaLimits(businessUseCaseUsage, appUsage) {
    if (!businessUseCaseUsage) return null;

    const analysis = {
      currentUsage: {},
      predictions: {},
      recommendations: {}
    };

    // Analyser chaque compte publicitaire
    Object.entries(businessUseCaseUsage).forEach(([accountId, usageData]) => {
      const data = usageData[0];
      if (!data) return;

      const tier = data.ads_api_access_tier || 'development_access';
      const callCount = data.call_count || 0;
      const totalTime = data.total_time || 0;
      const estimatedTimeToRegain = data.estimated_time_to_regain_access || 0;

      // Définir les limites selon le tier (basé sur la documentation Meta)
      const limits = this.getMetaLimitsByTier(tier);
      
      // Calculer l'utilisation actuelle
      const usagePercentages = {
        callsPerHour: Math.min(100, (callCount / limits.callsPerHour) * 100),
        callsPerDay: Math.min(100, (callCount / limits.callsPerDay) * 100),
        timePerHour: Math.min(100, (totalTime / limits.timePerHour) * 100)
      };

      // Prédire quand les limites seront atteintes
      const predictions = this.predictLimitReach(callCount, totalTime, limits, this.rateLimitMonitor);

      // Générer des recommandations
      const recommendations = this.generateRecommendations(usagePercentages, predictions, tier);

      analysis.currentUsage[accountId] = {
        tier,
        callCount,
        totalTime,
        estimatedTimeToRegain,
        usagePercentages,
        limits
      };

      analysis.predictions[accountId] = predictions;
      analysis.recommendations[accountId] = recommendations;
    });

    return analysis;
  }

  // Obtenir les limites Meta selon le tier
  getMetaLimitsByTier(tier) {
    const limits = {
      development_access: {
        callsPerHour: 200,
        callsPerDay: 4800,
        timePerHour: 1000000, // 1M ms = 1000s
        timePerDay: 24000000  // 24M ms = 6.67h
      },
      basic_access: {
        callsPerHour: 1000,
        callsPerDay: 24000,
        timePerHour: 5000000,
        timePerDay: 120000000
      },
      standard_access: {
        callsPerHour: 5000,
        callsPerDay: 120000,
        timePerHour: 25000000,
        timePerDay: 600000000
      },
      advanced_access: {
        callsPerHour: 10000,
        callsPerDay: 240000,
        timePerHour: 50000000,
        timePerDay: 1200000000
      }
    };

    return limits[tier] || limits.development_access;
  }

  // Prédire quand les limites seront atteintes
  predictLimitReach(currentCalls, currentTime, limits, monitor) {
    const currentRate = monitor.reachCallsThisMinute + monitor.searchCallsThisMinute;
    const avgTimePerCall = currentCalls > 0 ? currentTime / currentCalls : 1000; // 1s par défaut

    // Calculer le temps restant avant d'atteindre la limite horaire
    let timeToReachCalls = null;
    let willReachInCalls = 'N/A';
    
    if (currentRate > 0 && currentCalls < limits.callsPerHour) {
      timeToReachCalls = Math.floor((limits.callsPerHour - currentCalls) / currentRate * 60);
      willReachInCalls = `${timeToReachCalls} minutes`;
    } else if (currentCalls >= limits.callsPerHour) {
      timeToReachCalls = 0;
      willReachInCalls = 'Limite déjà atteinte';
    }

    // Calculer le temps restant avant d'atteindre la limite de temps
    let timeToReachTime = null;
    let willReachInTime = 'N/A';
    
    if (currentRate > 0 && currentTime < limits.timePerHour) {
      timeToReachTime = Math.floor((limits.timePerHour - currentTime) / (currentRate * avgTimePerCall) * 60);
      willReachInTime = `${timeToReachTime} minutes`;
    } else if (currentTime >= limits.timePerHour) {
      timeToReachTime = 0;
      willReachInTime = 'Limite déjà atteinte';
    }

    const predictions = {
      callsPerHour: {
        remaining: Math.max(0, limits.callsPerHour - currentCalls),
        timeToReach: timeToReachCalls,
        willReachIn: willReachInCalls
      },
      timePerHour: {
        remaining: Math.max(0, limits.timePerHour - currentTime),
        timeToReach: timeToReachTime,
        willReachIn: willReachInTime
      }
    };

    return predictions;
  }

  // Générer des recommandations basées sur l'utilisation
  generateRecommendations(usagePercentages, predictions, tier) {
    const recommendations = [];

    // Vérifier l'utilisation par heure
    if (usagePercentages.callsPerHour > 80) {
      recommendations.push({
        type: 'warning',
        message: `⚠️ Utilisation élevée: ${Math.round(usagePercentages.callsPerHour)}% des appels/heure`,
        action: 'Ralentir le traitement ou attendre le reset'
      });
    }

    if (usagePercentages.callsPerHour > 95) {
      recommendations.push({
        type: 'critical',
        message: `🚨 Limite critique: ${Math.round(usagePercentages.callsPerHour)}% des appels/heure`,
        action: 'Arrêter immédiatement et attendre le reset'
      });
    }

    // Vérifier si la limite est déjà atteinte
    if (predictions.callsPerHour.timeToReach === 0 && usagePercentages.callsPerHour >= 100) {
      recommendations.push({
        type: 'critical',
        message: '🚨 Limite horaire déjà atteinte',
        action: 'Arrêter et attendre le reset horaire'
      });
    }

    // Recommandations générales
    if (tier === 'development_access') {
      recommendations.push({
        type: 'info',
        message: '💡 Tier développement: Limites réduites, considérer l\'upgrade',
        action: 'Contacter Meta pour un accès standard'
      });
    }

    return recommendations;
  }

  // Ajuster dynamiquement les limites basées sur les headers Meta
  adjustRateLimits(metaUsage) {
    const now = Date.now();
    const timeSinceLastAdjustment = now - this.rateLimitMonitor.adaptiveLimits.lastAdjustment;
    
    // Ajuster seulement toutes les 30 secondes pour éviter les changements trop fréquents
    if (timeSinceLastAdjustment < 30000) return;
    
    let newMultiplier = 1.0;
    
    // Calculer le multiplicateur basé sur l'utilisation
    if (metaUsage.appUsage && metaUsage.appUsage.call_count > 0.95) {
      newMultiplier = 0.5; // Réduire de 50%
    } else if (metaUsage.appUsage && metaUsage.appUsage.call_count > 0.9) {
      newMultiplier = 0.7; // Réduire de 30%
    } else if (metaUsage.appUsage && metaUsage.appUsage.call_count < 0.5) {
      newMultiplier = 1.2; // Augmenter de 20%
    }
    
    if (newMultiplier !== this.rateLimitMonitor.adaptiveLimits.currentMultiplier) {
      console.log(`🔄 Adjusting rate limits: ${this.rateLimitMonitor.adaptiveLimits.currentMultiplier} → ${newMultiplier}`);
      
      // Ajuster les limites des rate limiters
      const newReachLimit = Math.floor(this.config.reachEstimate.callsPerMinute * newMultiplier);
      const newSearchLimit = Math.floor(this.config.search.callsPerMinute * newMultiplier);
      
      this.rateLimiter.updateSettings({
        reservoir: newReachLimit,
        reservoirRefreshAmount: newReachLimit
      });
      
      this.searchLimiter.updateSettings({
        reservoir: newSearchLimit,
        reservoirRefreshAmount: newSearchLimit
      });
      
      this.rateLimitMonitor.adaptiveLimits.currentMultiplier = newMultiplier;
      this.rateLimitMonitor.adaptiveLimits.lastAdjustment = now;
      
      console.log(`📊 New limits: ${newReachLimit}/min reach, ${newSearchLimit}/min search`);
    }
  }

  // Obtenir le statut des limites en temps réel
  getRateLimitStatus() {
    const now = Date.now();
    const timeSinceReset = Math.floor((now - this.rateLimitMonitor.lastMinuteReset) / 1000);
    const timeUntilReset = 60 - timeSinceReset;
    
    return {
      reachCallsThisMinute: this.rateLimitMonitor.reachCallsThisMinute,
      searchCallsThisMinute: this.rateLimitMonitor.searchCallsThisMinute,
      reachLimit: this.config.reachEstimate.callsPerMinute,
      searchLimit: this.config.search.callsPerMinute,
      timeUntilReset: Math.max(0, timeUntilReset),
      totalCalls: this.rateLimitMonitor.totalCalls,
      totalErrors: this.rateLimitMonitor.errors,
      rateLimitErrors: this.rateLimitMonitor.rateLimitErrors,
      environment: this.environment,
      metaUsage: this.rateLimitMonitor.metaUsage || null,
      adaptiveLimits: this.rateLimitMonitor.adaptiveLimits
    };
  }

  // Optimisation intelligente basée sur le nombre de codes
  async processOptimized(postalCodes, countryCode, adAccountId, targetingSpec) {
    const totalCodes = postalCodes.length;
    
    // Utilisation de la configuration d'environnement
    const batchSize = getBatchSize(this.environment, totalCodes);
    const estimatedTime = estimateProcessingTime(this.environment, totalCodes);

    console.log(`⚡ Optimized settings for ${totalCodes} codes (${this.environment} environment):`);
    console.log(`   - Batch size: ${batchSize}`);
    console.log(`   - Max concurrent reach: ${this.config.reachEstimate.maxConcurrent}`);
    console.log(`   - Max concurrent search: ${this.config.search.maxConcurrent}`);
    console.log(`   - Estimated time: ~${estimatedTime.estimatedMinutes} minutes (${estimatedTime.batches} batches)`);
    console.log(`   - Rate limits: ${this.config.reachEstimate.callsPerMinute}/min reach, ${this.config.search.callsPerMinute}/min search`);

    return this.processBatch(postalCodes, countryCode, adAccountId, targetingSpec, batchSize);
  }

  // Statistiques de performance
  getStats() {
    // Si un traitement est en cours, retourner les vraies statistiques
    if (this.currentProcessing.isActive) {
      return {
        // Statistiques de traitement
        processed: this.currentProcessing.processedCodes || 0,
        successful: this.currentProcessing.successfulCodes || 0,
        errors: this.currentProcessing.errorCodes || 0,
        total: this.currentProcessing.totalCodes || 0,
        isProcessing: true,
        
        // Statistiques détaillées
        rateLimiter: {
          queued: 0,
          running: 0,
          done: 0,
          failed: 0
        },
        searchLimiter: {
          queued: 0,
          running: 0,
          done: 0,
          failed: 0
        },
        cache: {
          size: this.postalCodeCache.size,
          keys: Array.from(this.postalCodeCache.keys())
        },
        
        // Monitoring des rate limits
        rateLimitMonitor: this.rateLimitMonitor
      };
    } else {
      // Si aucun traitement n'est en cours, retourner des statistiques vides
      return {
        processed: 0,
        successful: 0,
        errors: 0,
        total: 0,
        isProcessing: false,
        
        // Statistiques détaillées
        rateLimiter: {
          queued: 0,
          running: 0,
          done: 0,
          failed: 0
        },
        searchLimiter: {
          queued: 0,
          running: 0,
          done: 0,
          failed: 0
        },
        cache: {
          size: this.postalCodeCache.size,
          keys: Array.from(this.postalCodeCache.keys())
        },
        
        // Monitoring des rate limits
        rateLimitMonitor: this.rateLimitMonitor
      };
    }
  }

  // Nettoyage du cache
  clearCache() {
    this.postalCodeCache.clear();
    console.log('🧹 Cache cleared');
  }
}

module.exports = ParallelProcessor;
