const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');

// Créer un nouveau projet
router.post('/', async (req, res) => {
  try {
    const { name, description, userId } = req.body;
    
    const result = await projectService.createProject({
      name,
      description,
      userId: userId || 'anonymous'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        project: result.project
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Récupérer un projet par ID
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await projectService.getProject(projectId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        project: result.project
      }
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Récupérer tous les projets d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📋 Getting projects for user:', userId);
    
    // Essayer d'abord le vrai service
    try {
      const result = await projectService.getUserProjects(userId);
      if (result.success) {
        console.log('✅ Real project service worked, returning:', result.projects.length, 'projects');
        return res.json({
          success: true,
          data: {
            projects: result.projects
          }
        });
      }
    } catch (dbError) {
      console.error('❌ Database service failed:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database service unavailable',
        error: dbError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Error getting user projects:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mettre à jour un projet
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    
    const result = await projectService.updateProject(projectId, updateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        project: result.project
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mettre à jour un projet (PATCH pour compatibilité)
router.patch('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    
    console.log('📋 PATCH request for project:', projectId);
    console.log('📋 Update data:', updateData);
    
    // Utiliser le vrai service de mise à jour
    const result = await projectService.updateProject(projectId, updateData);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      data: {
        project: result.project
      }
    });
    
    console.log('✅ Project updated successfully');
  } catch (error) {
    console.error('❌ Error updating project (PATCH):', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Supprimer un projet
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await projectService.deleteProject(projectId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Récupérer les résultats d'un projet
router.get('/:projectId/results', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await projectService.getProjectResults(projectId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        results: result.results
      }
    });
  } catch (error) {
    console.error('Error getting project results:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Sauvegarder les résultats de traitement
router.post('/:projectId/results', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { results } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: 'Results array is required'
      });
    }

    const result = await projectService.saveProcessingResults(projectId, results);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        savedCount: result.savedCount
      }
    });
  } catch (error) {
    console.error('Error saving project results:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Fonction asynchrone pour traiter les estimations Meta API
async function processMetaAPIEstimates(projectId, targeting_spec, baseUrl) {
  try {
    console.log(`🚀 [ASYNC] Démarrage du traitement Meta API pour le projet ${projectId}`);
    
    // Marquer le projet comme "processing" 
    await projectService.updateProject(projectId, { status: 'processing' });

    // 2. Récupérer les codes postaux du projet depuis la base de données
    const postalCodesResult = await projectService.getProjectResults(projectId);
    
    if (!postalCodesResult.success || !postalCodesResult.results || postalCodesResult.results.length === 0) {
      console.error(`❌ [ASYNC] No postal codes found for project ${projectId}`);
      await projectService.updateProject(projectId, { status: 'error' });
      return;
    }

    const postalCodes = postalCodesResult.results.map(r => r.postal_code);
    console.log(`🚀 [ASYNC] Calcul des estimations Meta API pour ${postalCodes.length} codes postaux...`);

    // 3. Calculer les estimations Meta API pour chaque code postal - APPEL DIRECT
    const metaApi = require('../config/meta-api');
    const updatedResults = [];

    for (const postalCode of postalCodes) {
      try {
        console.log(`🔄 [ASYNC] Traitement de ${postalCode}...`);
        
        // 1. Premier appel Meta API direct : Code postal seul (estimation géographique)
        try {
          // Rechercher le code postal dans Meta API
          const searchResponse = await metaApi.api.call(
            'GET',
            ['search'],
            {
              type: 'adgeolocation',
              location_types: JSON.stringify(['zip']),
              q: postalCode,
              country_code: 'US',
              limit: 1,
              access_token: process.env.META_ACCESS_TOKEN
            }
          );

          if (!searchResponse.data || searchResponse.data.length === 0) {
            throw new Error(`Code postal ${postalCode} non trouvé`);
          }

          const zipCodeData = searchResponse.data[0];
          console.log(`✅ [ASYNC] ${postalCode}: Code postal trouvé:`, zipCodeData.key);

          // Créer le targeting spec géographique
          const geoTargetingSpec = {
            geo_locations: {
              zips: [{
                key: zipCodeData.key,
                name: zipCodeData.name,
                country_code: zipCodeData.country_code
              }]
            },
            age_min: targeting_spec.age_min || 18,
            age_max: targeting_spec.age_max || 65,
            genders: targeting_spec.genders ? targeting_spec.genders.map(g => parseInt(g)) : [1, 2],
            device_platforms: ['mobile', 'desktop'],
            interests: [] // Pas d'intérêts pour l'estimation géographique
          };

          // Obtenir l'estimation géographique
          const geoReachResponse = await metaApi.api.call(
            'GET',
            [`act_${process.env.META_AD_ACCOUNT_ID || '379481728925498'}/delivery_estimate`],
            {
              targeting_spec: JSON.stringify(geoTargetingSpec),
              access_token: process.env.META_ACCESS_TOKEN
            }
          );

          console.log(`🔍 [ASYNC] ${postalCode}: Réponse estimation géographique:`, geoReachResponse);
        
        if (geoReachResponse?.data?.users_lower_bound !== undefined) {
          const audienceEstimate = geoReachResponse.data.users_lower_bound || geoReachResponse.data.users_upper_bound || 0;
          
          console.log(`✅ [ASYNC] ${postalCode}: Estimation géographique = ${audienceEstimate}`);
          
          // 2. Deuxième appel Meta API direct : Code postal + targeting (estimation avec targeting)
          const targetingTargetingSpec = {
            geo_locations: {
              zips: [{
                key: zipCodeData.key,
                name: zipCodeData.name,
                country_code: zipCodeData.country_code
              }]
            },
            age_min: targeting_spec.age_min || 18,
            age_max: targeting_spec.age_max || 65,
            genders: targeting_spec.genders ? targeting_spec.genders.map(g => parseInt(g)) : [1, 2],
            device_platforms: ['mobile', 'desktop'],
            interests: targeting_spec.interests || []
          };

          const targetingReachResponse = await metaApi.api.call(
            'GET',
            [`act_${process.env.META_AD_ACCOUNT_ID || '379481728925498'}/delivery_estimate`],
            {
              targeting_spec: JSON.stringify(targetingTargetingSpec),
              access_token: process.env.META_ACCESS_TOKEN
            }
          );

          let targetingEstimate = 0; // Valeur par défaut différente pour distinguer les cas

          if (targetingReachResponse?.data?.users_lower_bound !== undefined) {
            targetingEstimate = targetingReachResponse.data.users_lower_bound || targetingReachResponse.data.users_upper_bound || 0;
            console.log(`✅ [ASYNC] ${postalCode}: Estimation avec targeting = ${targetingEstimate}`);
          } else {
            console.warn(`⚠️ [ASYNC] ${postalCode}: Impossible d'obtenir l'estimation avec targeting, utilisation de 50% de l'estimation géographique`);
            // En cas d'échec, utiliser 50% de l'estimation géographique pour différencier
            targetingEstimate = Math.round(audienceEstimate * 0.5);
          }

          console.log(`✅ [ASYNC] ${postalCode}: audience=${audienceEstimate}, targeting=${targetingEstimate}`);

          // Mettre à jour le résultat existant dans la base au lieu d'en créer un nouveau
          console.log(`💾 [ASYNC] ${postalCode}: Sauvegarde des estimations...`);
          const updateResult = await projectService.updateProcessingResult(projectId, postalCode, {
            success: true,
            postalCodeOnlyEstimate: { audience_size: audienceEstimate },
            postalCodeWithTargetingEstimate: { audience_size: targetingEstimate }
          });
          
          if (updateResult.success) {
            console.log(`✅ [ASYNC] ${postalCode}: Estimations sauvegardées avec succès`);
          } else {
            console.error(`❌ [ASYNC] ${postalCode}: Erreur sauvegarde:`, updateResult.error);
          }

          updatedResults.push({
            postal_code: postalCode,
            success: true,
            audience_estimate: audienceEstimate,
            targeting_estimate: targetingEstimate
          });

        } else {
          console.error(`❌ [ASYNC] ${postalCode}: Estimation géographique indisponible`);
          
          await projectService.updateProcessingResult(projectId, postalCode, {
            success: false,
            postalCodeOnlyEstimate: { audience_size: 0 },
            postalCodeWithTargetingEstimate: { audience_size: 0 },
            error: 'Geo estimation unavailable'
          });

          updatedResults.push({
            postal_code: postalCode,
            success: false,
            audience_estimate: 0,
            targeting_estimate: 0,
            error: 'Geo estimation unavailable'
          });
        }

        } catch (metaError) {
          console.error(`❌ [ASYNC] ${postalCode}: Erreur Meta API:`, metaError.message);
          
          await projectService.updateProcessingResult(projectId, postalCode, {
            success: false,
            postalCodeOnlyEstimate: { audience_size: 0 },
            postalCodeWithTargetingEstimate: { audience_size: 0 },
            error: metaError.message
          });

          updatedResults.push({
            postal_code: postalCode,
            success: false,
            audience_estimate: 0,
            targeting_estimate: 0,
            error: metaError.message
          });
        }

        // Délai entre les appels pour respecter les rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ [ASYNC] Erreur calcul estimation ${postalCode}:`, error.message);
        
        await projectService.updateProcessingResult(projectId, postalCode, {
          success: false,
          postalCodeOnlyEstimate: { audience_size: 0 },
          postalCodeWithTargetingEstimate: { audience_size: 0 },
          error: error.message
        });

        updatedResults.push({
          postal_code: postalCode,
          success: false,
          audience_estimate: 0,
          targeting_estimate: 0,
          error: error.message
        });
      }
    }

    console.log(`✅ [ASYNC] Estimations Meta API calculées pour ${updatedResults.length} codes postaux`);

    // 4. Mettre à jour le statut du projet
    await projectService.updateProject(projectId, { 
      status: 'completed',
      processed_postal_codes: updatedResults.filter(r => r.success).length,
      error_postal_codes: updatedResults.filter(r => !r.success).length
    });

    console.log(`🎉 [ASYNC] Traitement Meta API terminé pour le projet ${projectId}`);
  } catch (error) {
    console.error(`❌ [ASYNC] Erreur durant le traitement Meta API pour le projet ${projectId}:`, error);
    await projectService.updateProject(projectId, { status: 'error' });
  }
}

// Mettre à jour le targeting spec d'un projet ET lancer les estimations Meta API en arrière-plan
router.patch('/:projectId/targeting', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { targeting_spec } = req.body;
    
    console.log('📋 Updating targeting spec for project:', projectId);
    console.log('📋 Targeting spec:', JSON.stringify(targeting_spec, null, 2));
    
    if (!targeting_spec) {
      return res.status(400).json({
        success: false,
        message: 'Targeting spec is required'
      });
    }

    // 1. Mettre à jour le targeting spec
    const result = await projectService.updateProject(projectId, { targeting_spec });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // 2. Vérifier que le projet a des codes postaux
    const postalCodesResult = await projectService.getProjectResults(projectId);
    
    if (!postalCodesResult.success || !postalCodesResult.results || postalCodesResult.results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No postal codes found for this project'
      });
    }

    const postalCodesCount = postalCodesResult.results.length;
    console.log(`🚀 Found ${postalCodesCount} postal codes for project ${projectId}`);

    // 3. Répondre immédiatement au frontend
    res.json({
      success: true,
      message: 'Targeting spec updated successfully. Meta API processing started in background.',
      data: {
        project: result.project,
        totalPostalCodes: postalCodesCount,
        status: 'processing_started'
      }
    });

    // 4. Traitement Meta API - synchrone pour <5 codes postaux, asynchrone pour plus
    if (postalCodesCount <= 4) {
      console.log(`🚀 Processing ${postalCodesCount} postal codes synchronously...`);
      try {
        // Traitement synchrone pour les petites listes
        const baseUrl = req.protocol + '://' + req.get('host');
        await processMetaAPIEstimates(projectId, targeting_spec, baseUrl);
        console.log(`✅ Synchronous processing completed for project ${projectId}`);
      } catch (error) {
        console.error(`❌ Synchronous processing failed for project ${projectId}:`, error);
      }
    } else {
      console.log(`🚀 Processing ${postalCodesCount} postal codes asynchronously...`);
      // Traitement asynchrone pour les grandes listes
      const baseUrl = req.protocol + '://' + req.get('host');
      setImmediate(() => {
        processMetaAPIEstimates(projectId, targeting_spec, baseUrl)
          .catch(error => {
            console.error(`❌ Background processing failed for project ${projectId}:`, error);
          });
      });
    }

  } catch (error) {
    console.error('Error updating project targeting spec and calculating estimates:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get project processing status
router.get('/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await projectService.getProjectStatus(projectId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.status
    });
  } catch (error) {
    console.error('Error getting project status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug endpoint pour tester la sauvegarde des estimations
router.patch('/:projectId/debug-save-estimates', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`🧪 [DEBUG] Testing save estimates for project ${projectId}`);
    
    // Récupérer les codes postaux du projet
    const postalCodesResult = await projectService.getProjectResults(projectId);
    
    if (!postalCodesResult.success || !postalCodesResult.results || postalCodesResult.results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No postal codes found for this project'
      });
    }

    const results = [];
    for (const result of postalCodesResult.results) {
      const postalCode = result.postal_code;
      
      // Utiliser des valeurs mock pour tester la sauvegarde
      const mockAudienceEstimate = Math.floor(Math.random() * 50000) + 10000; // 10k-60k
      const mockTargetingEstimate = Math.floor(mockAudienceEstimate * 0.7); // 70% de l'audience
      
      console.log(`🧪 [DEBUG] ${postalCode}: Mock estimates - audience=${mockAudienceEstimate}, targeting=${mockTargetingEstimate}`);
      
      // Tester la sauvegarde
      const updateResult = await projectService.updateProcessingResult(projectId, postalCode, {
        success: true,
        postalCodeOnlyEstimate: { audience_size: mockAudienceEstimate },
        postalCodeWithTargetingEstimate: { audience_size: mockTargetingEstimate }
      });
      
      if (updateResult.success) {
        console.log(`✅ [DEBUG] ${postalCode}: Sauvegarde réussie`);
        results.push({
          postal_code: postalCode,
          success: true,
          audience_estimate: mockAudienceEstimate,
          targeting_estimate: mockTargetingEstimate,
          saved: true
        });
      } else {
        console.error(`❌ [DEBUG] ${postalCode}: Erreur sauvegarde:`, updateResult.error);
        results.push({
          postal_code: postalCode,
          success: false,
          error: updateResult.error,
          saved: false
        });
      }
    }

    // Mettre à jour le statut du projet
    await projectService.updateProject(projectId, { 
      status: 'completed',
      processed_postal_codes: results.filter(r => r.success).length,
      error_postal_codes: results.filter(r => !r.success).length
    });

    res.json({
      success: true,
      message: 'Debug save completed',
      results: results
    });

  } catch (error) {
    console.error('Error in debug save estimates:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug endpoint pour tester les variables Meta API
router.get('/debug/meta-test/:postalCode', async (req, res) => {
  try {
    const { postalCode } = req.params;
    
    console.log(`🧪 [META-DEBUG] Testing Meta API for postal code: ${postalCode}`);
    
    // Test des variables d'environnement
    const envCheck = {
      META_ACCESS_TOKEN_EXISTS: !!process.env.META_ACCESS_TOKEN,
      META_ACCESS_TOKEN_PREFIX: process.env.META_ACCESS_TOKEN ? process.env.META_ACCESS_TOKEN.substring(0, 20) + '...' : 'MISSING',
      META_AD_ACCOUNT_ID: process.env.META_AD_ACCOUNT_ID || '379481728925498'
    };
    
    console.log('🔍 [META-DEBUG] Environment check:', envCheck);
    
    if (!process.env.META_ACCESS_TOKEN) {
      return res.status(400).json({
        success: false,
        message: 'META_ACCESS_TOKEN is missing',
        envCheck
      });
    }

    // Test appel Meta API direct
    const metaApi = require('../config/meta-api');
    
    try {
      // 1. Test recherche du code postal
      console.log(`🔍 [META-DEBUG] Searching for postal code: ${postalCode}`);
      
      const searchResponse = await metaApi.api.call(
        'GET',
        ['search'],
        {
          type: 'adgeolocation',
          location_types: JSON.stringify(['zip']),
          q: postalCode,
          country_code: 'US',
          limit: 1,
          access_token: process.env.META_ACCESS_TOKEN
        }
      );

      console.log(`🔍 [META-DEBUG] Search response:`, searchResponse);

      if (!searchResponse.data || searchResponse.data.length === 0) {
        return res.json({
          success: false,
          message: `Postal code ${postalCode} not found`,
          envCheck,
          searchResponse
        });
      }

      const zipCodeData = searchResponse.data[0];
      console.log(`✅ [META-DEBUG] Found zip code:`, zipCodeData);

      // 2. Test estimation
      const targetingSpec = {
        geo_locations: {
          zips: [{
            key: zipCodeData.key,
            name: zipCodeData.name,
            country_code: zipCodeData.country_code
          }]
        },
        age_min: 25,
        age_max: 45,
        genders: [1],
        device_platforms: ['mobile', 'desktop'],
        interests: []
      };

      console.log(`🔍 [META-DEBUG] Targeting spec:`, JSON.stringify(targetingSpec, null, 2));

      const estimateResponse = await metaApi.api.call(
        'GET',
        [`act_${envCheck.META_AD_ACCOUNT_ID}/delivery_estimate`],
        {
          targeting_spec: JSON.stringify(targetingSpec),
          access_token: process.env.META_ACCESS_TOKEN
        }
      );

      console.log(`🔍 [META-DEBUG] Estimate response:`, estimateResponse);

      const audienceEstimate = estimateResponse?.data?.users_lower_bound || estimateResponse?.data?.users_upper_bound || 0;

      res.json({
        success: true,
        message: 'Meta API test completed successfully',
        data: {
          postalCode,
          zipCodeData,
          targetingSpec,
          estimateResponse,
          audienceEstimate,
          envCheck
        }
      });

    } catch (metaError) {
      console.error(`❌ [META-DEBUG] Meta API error:`, metaError);
      res.json({
        success: false,
        message: 'Meta API error',
        error: metaError.message,
        envCheck
      });
    }

  } catch (error) {
    console.error('Error in meta test:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

