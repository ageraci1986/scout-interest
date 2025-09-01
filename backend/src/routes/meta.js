const express = require('express');
const router = express.Router();

console.log('📁 Meta routes loaded at:', new Date().toISOString());
const metaApi = require('../config/meta-api');
const db = require('../config/database');
const ParallelProcessor = require('../services/parallelProcessor');

const { RATE_LIMITS, getEnvironmentConfig, estimateProcessingTime, validateRateLimitConfig } = require('../config/rateLimits');
const { convertAdvancedTargetingToMetaFormat, validateTargetingSpec } = require('../utils/targetingUtils');

// Instance globale du processeur parallèle
const parallelProcessor = new ParallelProcessor();

// Search interests
router.get('/interests/search', async (req, res) => {
  try {
    const { q, countryCode = 'US' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
    }

    const results = await metaApi.searchInterests(q, 5); // Limite fixée à 5
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching interests:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get reach estimate
router.post('/reach-estimate', async (req, res) => {
  try {
    const { adAccountId, targetingSpec, advancedTargetingSpec } = req.body;
    
    if (!adAccountId) {
      return res.status(400).json({
        success: false,
        message: 'adAccountId is required'
      });
    }

    let formattedTargetingSpec;

    // Handle advanced targeting spec (with interest groups)
    if (advancedTargetingSpec) {
      console.log('📋 Processing advanced targeting spec:', JSON.stringify(advancedTargetingSpec, null, 2));
      
      // Validate the advanced targeting spec
      const validationErrors = validateTargetingSpec(advancedTargetingSpec);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid targeting specification',
          errors: validationErrors
        });
      }

      // Convert advanced targeting to Meta API format
      formattedTargetingSpec = convertAdvancedTargetingToMetaFormat(advancedTargetingSpec);
      console.log('🔄 Converted to Meta format:', JSON.stringify(formattedTargetingSpec, null, 2));
    }
    // Handle legacy targeting spec
    else if (targetingSpec && Object.keys(targetingSpec).length > 0) {
      console.log('📋 Processing legacy targeting spec:', JSON.stringify(targetingSpec, null, 2));
      
      formattedTargetingSpec = {
        age_min: targetingSpec.age_min || 18,
        age_max: targetingSpec.age_max || 65,
        genders: targetingSpec.genders && targetingSpec.genders.length > 0 ? targetingSpec.genders : [1, 2],
        publisher_platforms: ['audience_network', 'facebook', 'messenger', 'instagram'],
        geo_locations: targetingSpec.geo_locations || { country_groups: ['worldwide'] }
      };
      
      // Add interests only if they exist and are not empty
      if (targetingSpec.interests && targetingSpec.interests.length > 0) {
        formattedTargetingSpec.interests = targetingSpec.interests;
      } else {
        // Don't add interests if none provided - use only geo targeting
        console.warn('⚠️ No interests in targeting spec, using geo-only targeting');
        // Remove interests field entirely to avoid validation errors
        delete formattedTargetingSpec.interests;
      }
      
      console.log('🔄 Formatted targeting spec:', JSON.stringify(formattedTargetingSpec, null, 2));
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'Either targetingSpec or advancedTargetingSpec is required'
      });
    }

    // Use REST API directly for reach estimate
    const response = await metaApi.api.call(
      'GET',
      [adAccountId, 'reachestimate'],
      {
        targeting_spec: JSON.stringify(formattedTargetingSpec),
        optimization_goal: 'REACH',
        access_token: process.env.META_ACCESS_TOKEN
      }
    );
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error getting reach estimate:', error);
    
    // Handle rate limiting specifically
    if (error.message && error.message.includes('(#80004)')) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please wait a moment and try again.',
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get postal code reach estimate
router.post('/postal-code-reach-estimate', async (req, res) => {
  try {
    const { adAccountId, postalCode, countryCode = 'US', targetingSpec } = req.body;
    
    if (!adAccountId || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'adAccountId and postalCode are required'
      });
    }

    // Validate targeting spec
    if (!targetingSpec || Object.keys(targetingSpec).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid targeting spec is required'
      });
    }

    // Format targeting spec correctly for Meta API
    const formattedTargetingSpec = {
      geo_locations: targetingSpec.geo_locations?.[0] || targetingSpec.geo_locations,
      age_min: targetingSpec.age_min || 18,
      age_max: targetingSpec.age_max || 65,
      genders: targetingSpec.genders || [1, 2],
      device_platforms: targetingSpec.device_platforms || ['mobile', 'desktop'],
      interests: targetingSpec.interests || []
    };

    // Ensure we have at least some targeting criteria
    if (!formattedTargetingSpec.interests || formattedTargetingSpec.interests.length === 0) {
      console.warn('⚠️ No interests in targeting spec, using default targeting');
      // Add a default interest to avoid empty targeting spec
      formattedTargetingSpec.interests = [
        {
          id: "6002714395372",
          name: "Technology"
        }
      ];
    }

    // Use REST API directly for reach estimate
    const response = await metaApi.api.call(
      'GET',
      [adAccountId, 'reachestimate'],
      {
        targeting_spec: JSON.stringify(formattedTargetingSpec),
        optimization_goal: 'REACH',
        access_token: process.env.META_ACCESS_TOKEN
      }
    );
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error getting postal code reach estimate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Route pour le traitement par lots avec gestion robuste des projets
router.post('/batch-postal-codes-reach-estimate-v2', async (req, res) => {
  console.log('🚀 BATCH ROUTE CALLED - Request received at:', new Date().toISOString());
  console.log('🚀 Request headers:', req.headers);
  console.log('🚀 Request body keys:', Object.keys(req.body || {}));
  console.log('🚀 ROUTE DEFINITION UPDATED - This should appear if the file is reloaded');
  
  try {
    const { adAccountId, postalCodes, targetingSpec = {}, countryCode = 'US', projectId } = req.body;
    
    console.log('🔄 Processing batch request:', {
      adAccountId,
      postalCodesCount: postalCodes?.length,
      countryCode,
      projectId,
      hasTargetingSpec: !!targetingSpec
    });
    
    // Debug: Afficher le targeting spec complet
    console.log('🎯 Full targeting spec received:', JSON.stringify(targetingSpec, null, 2));

    // Validation robuste du projectId
    let validProjectId = null;
    if (projectId) {
      try {
        const projectService = require('../services/projectService');
        const projectResult = await projectService.getProject(projectId);
        if (projectResult.success && projectResult.project) {
          validProjectId = projectId;
          console.log(`✅ Valid project found: ${projectId} - ${projectResult.project.name}`);
        } else {
          console.warn(`⚠️ Invalid projectId provided: ${projectId}`);
        }
      } catch (error) {
        console.error(`❌ Error validating projectId ${projectId}:`, error);
      }
    }

    // Si pas de projectId valide, créer un projet automatiquement
    if (!validProjectId) {
      try {
        const projectService = require('../services/projectService');
        const projectData = {
          name: `Auto-generated project - ${new Date().toISOString().slice(0, 19)}`,
          description: `Auto-generated project for batch processing with ${postalCodes?.length || 0} postal codes`,
          userId: 'anonymous'
        };
        
        const createResult = await projectService.createProject(projectData);
        if (createResult.success && createResult.project) {
          validProjectId = createResult.project.id;
          console.log(`✅ Auto-created project: ${validProjectId}`);
        } else {
          console.error('❌ Failed to auto-create project:', createResult.error);
        }
      } catch (error) {
        console.error('❌ Error auto-creating project:', error);
      }
    }

    if (!validProjectId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to create or validate project ID'
      });
    }

    // Traitement avec le projectId validé
    const processor = new ParallelProcessor();
    const result = await processor.processBatch(
      postalCodes,
      countryCode,
      adAccountId,
      targetingSpec,
      10
    );

    console.log(`✅ Batch processing completed: ${result.successful} successful, ${result.errors} errors`);

    // Sauvegarder les résultats avec le projectId validé
    if (result.results && result.results.length > 0) {
      try {
        const projectService = require('../services/projectService');
        const saveResult = await projectService.saveProcessingResults(validProjectId, result.results);

        if (saveResult.success) {
          console.log(`✅ Saved ${saveResult.savedCount} results to project ${validProjectId}`);
        } else {
          console.error('❌ Failed to save results to project:', saveResult.error);
        }
      } catch (saveError) {
        console.error('❌ Error saving results to project:', saveError);
      }
    }

    res.json({
      success: true,
      data: {
        totalProcessed: result.totalProcessed,
        successful: result.successful,
        errors: result.errors,
        results: result.results,
        errorDetails: result.errorDetails,
        rateLimitInfo: result.rateLimitInfo,
        projectId: validProjectId
      }
    });
  } catch (error) {
    console.error('Error in batch postal codes reach estimate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Route pour obtenir le statut de traitement en temps réel
router.get('/processing-status', (req, res) => {
  try {
    // Obtenir les vraies statistiques du ParallelProcessor
    const stats = parallelProcessor.getStats();
    console.log('📊 Processing status requested, current stats:', JSON.stringify(stats, null, 2));
    
    const responseData = {
      processed: stats.processed || 0,
      successful: stats.successful || 0,
      errors: stats.errors || 0,
      total: stats.total || 0,
      isProcessing: stats.isProcessing || false
    };
    
    console.log('📊 Sending response:', JSON.stringify(responseData, null, 2));
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error getting processing status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get targeting sentence lines
router.get('/targeting-sentence-lines', async (req, res) => {
  try {
    const { adAccountId, q } = req.query;
    
    if (!adAccountId || !q) {
      return res.status(400).json({
        success: false,
        message: 'adAccountId and q parameters are required'
      });
    }

    const lines = await metaApi.getTargetingSentenceLines(adAccountId, q);
    
    res.json({
      success: true,
      data: lines
    });
  } catch (error) {
    console.error('Error getting targeting sentence lines:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Validate access token
router.get('/validate-token', async (req, res) => {
  try {
    const validation = await metaApi.validateToken();
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid access token'
    });
  }
});

// Get rate limit status
router.get('/rate-limit', (req, res) => {
  try {
    const status = metaApi.getRateLimitStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get ad account configuration
router.get('/ad-account', (req, res) => {
  try {
    const adAccountId = process.env.META_AD_ACCOUNT_ID || 'act_379481728925498';
    res.json({
      success: true,
      data: {
        ad_account_id: adAccountId,
        is_configured: !!process.env.META_AD_ACCOUNT_ID
      }
    });
  } catch (error) {
    console.error('Error getting ad account config:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search valid postal codes using Meta's targeting search API
router.get('/search-postal-codes', async (req, res) => {
  try {
    const { q, country_code = 'US', limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
    }

    console.log(`🔍 Searching postal codes for: ${q} in ${country_code}`);

    // Use Meta's targeting search API for zip codes
    const response = await metaApi.api.call(
      'GET',
      ['search'],
      {
        type: 'adgeolocation',
        location_types: JSON.stringify(['zip']),
        q: q,
        country_code: country_code,
        limit: parseInt(limit),
        access_token: process.env.META_ACCESS_TOKEN
      }
    );
    
    res.json({
      success: true,
      data: {
        query: q,
        country_code: country_code,
        results: response.data
      }
    });
  } catch (error) {
    console.error('Error searching postal codes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test reach estimate for a specific postal code using Meta's targeting search
router.post('/postal-code-reach-estimate-v2', async (req, res) => {
  try {
    const { adAccountId, postalCode, targetingSpec = {} } = req.body;
    
    if (!adAccountId || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'adAccountId and postalCode are required'
      });
    }

    // Get country_code from targetingSpec or default to US
    const country_code = targetingSpec.country_code || 'US';

    console.log(`🔍 Testing postal code reach estimate for: ${postalCode} in ${country_code}`);

    // First, search for the postal code to get its valid key
    const searchResponse = await metaApi.api.call(
      'GET',
      ['search'],
      {
        type: 'adgeolocation',
        location_types: JSON.stringify(['zip']),
        q: postalCode,
        country_code: country_code,
        limit: 1,
        access_token: process.env.META_ACCESS_TOKEN
      }
    );

    if (!searchResponse.data || searchResponse.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Postal code ${postalCode} not found in ${country_code}`
      });
    }

    const zipCodeData = searchResponse.data[0];
    console.log('✅ Found postal code:', zipCodeData);

    // Create targeting spec with the valid zip code key
    const formattedTargetingSpec = {
      geo_locations: {
        zips: [{
          key: zipCodeData.key,
          name: zipCodeData.name,
          country_code: zipCodeData.country_code
        }]
      },
      age_min: targetingSpec.age_min || 18,
      age_max: targetingSpec.age_max || 65,
      genders: targetingSpec.genders || ['1', '2'],
      device_platforms: targetingSpec.device_platforms || ['mobile', 'desktop'],
      interests: targetingSpec.interests || []
    };

    console.log('🎯 Using targeting spec:', formattedTargetingSpec);

    // Get reach estimate with the valid postal code
    const reachResponse = await metaApi.api.call(
      'GET',
      [adAccountId, 'reachestimate'],
      {
        targeting_spec: JSON.stringify(formattedTargetingSpec),
        optimization_goal: 'REACH',
        access_token: process.env.META_ACCESS_TOKEN
      }
    );
    
    res.json({
      success: true,
      data: {
        postalCode,
        country_code,
        zipCodeData: zipCodeData,
        reachEstimate: reachResponse.data,
        targetingSpec: formattedTargetingSpec
      }
    });
  } catch (error) {
    console.error('Error getting postal code reach estimate:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      postalCode: req.body.postalCode,
      country_code: req.body.targetingSpec?.country_code || 'US'
    });
  }
});

// Calculate reach estimate for uploaded postal codes from a project using Meta's targeting search
router.post('/project-postal-codes-reach-estimate-v2', async (req, res) => {
  try {
    const { projectId, adAccountId, targetingSpec = {} } = req.body;
    
    if (!projectId || !adAccountId) {
      return res.status(400).json({
        success: false,
        message: 'projectId and adAccountId are required'
      });
    }

    // Get country_code from targetingSpec or default to US
    const country_code = targetingSpec.country_code || 'US';

    console.log(`🔍 Calculating reach estimate for project ${projectId} postal codes using Meta's targeting search for ${country_code}...`);

    // Get postal codes from the project
    let postalCodes = [];
    try {
      const postalCodesResult = await db.query(
        'SELECT postal_code FROM postal_codes WHERE project_id = $1 AND status = $2',
        [projectId, 'valid']
      );
      postalCodes = postalCodesResult.rows.map(row => row.postal_code);
    } catch (error) {
      console.log('⚠️ Database not available, using mock postal codes...');
      // Mock postal codes for testing
      postalCodes = ['10001', '10002', '10003', '75001', '75002', '75003'];
    }

    if (postalCodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid postal codes found for this project'
      });
    }

    console.log(`📊 Found ${postalCodes.length} postal codes for project ${projectId}`);

    const results = [];
    const errors = [];

    // Process postal codes in batches to respect rate limits
    const batchSize = 3; // Process 3 at a time (slower due to search API)
    for (let i = 0; i < postalCodes.length; i += batchSize) {
      const batch = postalCodes.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(postalCodes.length / batchSize)}`);
      
      const batchPromises = batch.map(async (postalCode) => {
        try {
          // First, search for the postal code to get its valid key
          const searchResponse = await metaApi.api.call(
            'GET',
            ['search'],
            {
              type: 'adgeolocation',
              location_types: JSON.stringify(['zip']),
              q: postalCode,
              country_code: country_code,
              limit: 1,
              access_token: process.env.META_ACCESS_TOKEN
            }
          );

          if (!searchResponse.data || searchResponse.data.length === 0) {
            return {
              projectId,
              postalCode,
              country_code,
              success: false,
              error: `Postal code ${postalCode} not found in ${country_code}`
            };
          }

          const zipCodeData = searchResponse.data[0];

          // Create targeting spec with the valid zip code key
          const formattedTargetingSpec = {
            geo_locations: {
              zips: [{
                key: zipCodeData.key,
                name: zipCodeData.name,
                country_code: zipCodeData.country_code
              }]
            },
            age_min: targetingSpec.age_min || 18,
            age_max: targetingSpec.age_max || 65,
            genders: targetingSpec.genders || ['1', '2'],
            device_platforms: targetingSpec.device_platforms || ['mobile', 'desktop'],
            interests: targetingSpec.interests || []
          };

          // Get reach estimate with the valid postal code
          const reachResponse = await metaApi.api.call(
            'GET',
            [adAccountId, 'reachestimate'],
            {
              targeting_spec: JSON.stringify(formattedTargetingSpec),
              optimization_goal: 'REACH',
              access_token: process.env.META_ACCESS_TOKEN
            }
          );

          return {
            projectId,
            postalCode,
            country_code,
            zipCodeData: zipCodeData,
            success: true,
            reachEstimate: reachResponse.data,
            targetingSpec: formattedTargetingSpec
          };
        } catch (error) {
          console.error(`❌ Error processing postal code ${postalCode}:`, error.message);
          return {
            projectId,
            postalCode,
            country_code,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Separate successful results from errors
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result);
        } else {
          errors.push(result);
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < postalCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay for search API
      }
    }

    console.log(`✅ Project postal codes processing completed: ${results.length} successful, ${errors.length} errors`);

    // Update project with results
    try {
      await db.query(
        'UPDATE projects SET processed_postal_codes = $1 WHERE id = $2',
        [results.length, projectId]
      );
    } catch (error) {
      console.log('⚠️ Could not update project statistics (database not available)');
    }

    res.json({
      success: true,
      data: {
        projectId,
        totalProcessed: postalCodes.length,
        successful: results.length,
        errors: errors.length,
        results: results,
        errorDetails: errors
      }
    });
  } catch (error) {
    console.error('Error in project postal codes reach estimate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get postal codes from a project
router.get('/project/:projectId/postal-codes', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }

    console.log(`🔍 Getting postal codes for project ${projectId}...`);

    let postalCodes = [];
    try {
      const postalCodesResult = await db.query(
        'SELECT postal_code, country, status FROM postal_codes WHERE project_id = $1 ORDER BY postal_code',
        [projectId]
      );
      postalCodes = postalCodesResult.rows;
      console.log('✅ Retrieved postal codes from database');
    } catch (error) {
      console.log('⚠️ Database not available, using mock postal codes...');
      // Mock postal codes for testing
      postalCodes = [
        { postal_code: '10001', country: 'US', status: 'valid' },
        { postal_code: '10002', country: 'US', status: 'valid' },
        { postal_code: '10003', country: 'US', status: 'valid' },
        { postal_code: '75001', country: 'FR', status: 'valid' },
        { postal_code: '75002', country: 'FR', status: 'valid' },
        { postal_code: '75003', country: 'FR', status: 'valid' }
      ];
    }

    res.json({
      success: true,
      data: {
        projectId,
        postalCodes: postalCodes,
        total: postalCodes.length,
        valid: postalCodes.filter(pc => pc.status === 'valid').length,
        invalid: postalCodes.filter(pc => pc.status !== 'valid').length
      }
    });
  } catch (error) {
    console.error('Error getting project postal codes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
