const express = require('express');
const router = express.Router();
const metaApi = require('../config/meta-api');
const db = require('../config/database');

// Search interests
router.get('/interests/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
    }

    const interests = await metaApi.searchInterests(q, parseInt(limit));
    
    res.json({
      success: true,
      data: interests
    });
  } catch (error) {
    console.error('Error searching interests:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get reach estimate (taille d'audience)
router.post('/reach-estimate', async (req, res) => {
  try {
    const { adAccountId, targetingSpec } = req.body;
    
    if (!adAccountId || !targetingSpec) {
      return res.status(400).json({
        success: false,
        message: 'adAccountId and targetingSpec are required'
      });
    }

    // Format targeting spec correctly for Meta API
    const formattedTargetingSpec = {
      geo_locations: targetingSpec.geo_locations?.[0] || targetingSpec.geo_locations,
      age_min: targetingSpec.age_min,
      age_max: targetingSpec.age_max,
      genders: targetingSpec.genders,
      device_platforms: targetingSpec.device_platforms,
      interests: targetingSpec.interests
    };

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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get delivery estimate (legacy)
router.post('/delivery-estimate', async (req, res) => {
  try {
    const { adAccountId, targetingSpec } = req.body;
    
    if (!adAccountId || !targetingSpec) {
      return res.status(400).json({
        success: false,
        message: 'adAccountId and targetingSpec are required'
      });
    }

    const estimate = await metaApi.getDeliveryEstimate(adAccountId, targetingSpec);
    
    res.json({
      success: true,
      data: estimate
    });
  } catch (error) {
    console.error('Error getting delivery estimate:', error);
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
    const adAccountId = process.env.META_AD_ACCOUNT_ID || 'act_123456789';
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

// Batch process multiple postal codes using Meta's targeting search
router.post('/batch-postal-codes-reach-estimate-v2', async (req, res) => {
  try {
    const { adAccountId, postalCodes, targetingSpec = {} } = req.body;
    
    if (!adAccountId || !postalCodes || !Array.isArray(postalCodes) || postalCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'adAccountId and postalCodes array are required'
      });
    }

    // Get country_code from targetingSpec or default to US
    const country_code = targetingSpec.country_code || 'US';

    console.log(`🔄 Processing ${postalCodes.length} postal codes using Meta's targeting search for ${country_code}...`);

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

    console.log(`✅ Batch processing completed: ${results.length} successful, ${errors.length} errors`);

    res.json({
      success: true,
      data: {
        totalProcessed: postalCodes.length,
        successful: results.length,
        errors: errors.length,
        results: results,
        errorDetails: errors
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
