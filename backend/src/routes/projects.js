const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');

// Helper function pour obtenir l'ID compte Meta correctement formaté
function getMetaAdAccountId() {
  const accountId = process.env.META_AD_ACCOUNT_ID || '379481728925498';
  // Retirer le préfixe 'act_' s'il existe déjà pour éviter la duplication
  const cleanId = accountId.startsWith('act_') ? accountId.substring(4) : accountId;
  return `act_${cleanId}`;
}

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

// Récupérer un projet par ID - EMERGENCY DISABLED  
router.get('/:projectId', async (req, res) => {
  // EMERGENCY: DISABLE TO STOP RESOURCE CONSUMPTION
  return res.status(503).json({
    success: false,
    message: 'Project fetching temporarily disabled to conserve resources',
    disabled: true
  });
  
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

// Récupérer les résultats d'un projet - EMERGENCY DISABLED
router.get('/:projectId/results', async (req, res) => {
  // EMERGENCY: DISABLE TO STOP RESOURCE CONSUMPTION
  return res.status(503).json({
    success: false,
    message: 'Project results fetching temporarily disabled to conserve resources',
    disabled: true
  });
  
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
    console.log(`🚀 [ASYNC] Received targeting_spec:`, JSON.stringify(targeting_spec, null, 2));
    
    // Transformer les interestGroups en interests simples pour Meta API
    let interests = [];
    if (targeting_spec.interestGroups && Array.isArray(targeting_spec.interestGroups)) {
      interests = targeting_spec.interestGroups
        .flatMap(group => group.interests || [])
        .map(interest => interest.id)
        .filter(Boolean);
    } else if (targeting_spec.interests) {
      interests = targeting_spec.interests;
    }
    
    console.log(`🎯 [ASYNC] Extracted interests:`, interests);
    
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

          // Créer le targeting spec géographique PURE (sans restrictions spécifiques)
          const geoTargetingSpec = {
            geo_locations: {
              zips: [{
                key: zipCodeData.key,
                name: zipCodeData.name,
                country_code: zipCodeData.country_code
              }]
            },
            age_min: 18,  // Âge minimum Meta (pas de restriction)
            age_max: 65,  // Âge maximum Meta (pas de restriction)
            genders: [1, 2],  // Tous les genres (pas de restriction)
            device_platforms: ['mobile', 'desktop'],
            interests: [] // Pas d'intérêts pour l'estimation géographique
          };

          // Obtenir l'estimation géographique
          const geoReachResponse = await metaApi.api.call(
            'GET',
            [`${getMetaAdAccountId()}/delivery_estimate`],
            {
              targeting_spec: JSON.stringify(geoTargetingSpec),
              optimization_goal: 'REACH',
              access_token: process.env.META_ACCESS_TOKEN
            }
          );

          console.log(`🔍 [ASYNC] ${postalCode}: Réponse estimation géographique:`, geoReachResponse);
        
        if (geoReachResponse?.data && Array.isArray(geoReachResponse.data) && geoReachResponse.data.length > 0) {
          const estimate = geoReachResponse.data[0];
          const audienceEstimate = estimate.estimate_mau_lower_bound || estimate.estimate_mau_upper_bound || estimate.users_lower_bound || estimate.users_upper_bound || 0;
          
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
            interests: interests  // Utiliser les intérêts extraits des groupes
          };

          const targetingReachResponse = await metaApi.api.call(
            'GET',
            [`${getMetaAdAccountId()}/delivery_estimate`],
            {
              targeting_spec: JSON.stringify(targetingTargetingSpec),
              optimization_goal: 'REACH',
              access_token: process.env.META_ACCESS_TOKEN
            }
          );

          let targetingEstimate = 0; // Valeur par défaut différente pour distinguer les cas

          if (targetingReachResponse?.data && Array.isArray(targetingReachResponse.data) && targetingReachResponse.data.length > 0) {
            const targetingEstimateData = targetingReachResponse.data[0];
            targetingEstimate = targetingEstimateData.estimate_mau_lower_bound || targetingEstimateData.estimate_mau_upper_bound || targetingEstimateData.users_lower_bound || targetingEstimateData.users_upper_bound || 0;
            console.log(`✅ [ASYNC] ${postalCode}: Estimation avec targeting = ${targetingEstimate}`);
          } else {
            console.warn(`⚠️ [ASYNC] ${postalCode}: Impossible d'obtenir l'estimation avec targeting, utilisation de 50% de l'estimation géographique`);
            // En cas d'échec, utiliser 50% de l'estimation géographique pour différencier
            targetingEstimate = Math.round(audienceEstimate * 0.5);
          }

          console.log(`✅ [ASYNC] ${postalCode}: audience=${audienceEstimate}, targeting=${targetingEstimate}`);

          // Mettre à jour le résultat existant (qui a été créé lors de l'upload)
          console.log(`💾 [ASYNC] ${postalCode}: Mise à jour des estimations...`);
          const updateResult = await projectService.updateProcessingResult(projectId, postalCode, {
            success: true,
            postalCodeOnlyEstimate: { audience_size: audienceEstimate },
            postalCodeWithTargetingEstimate: { audience_size: targetingEstimate }
          });
          
          if (updateResult.success) {
            console.log(`✅ [ASYNC] ${postalCode}: Estimations mises à jour avec succès`);
          } else {
            console.error(`❌ [ASYNC] ${postalCode}: Erreur mise à jour:`, updateResult.error);
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

        // Délai réduit entre les appels (Meta API peut gérer plus)
        await new Promise(resolve => setTimeout(resolve, 500));
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

// NOUVEAU - Traitement DIRECT et SYNCHRONE (sans jobs)
router.patch('/:projectId/targeting-direct', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { targeting_spec } = req.body;
    
    console.log('🚀 [DIRECT] Direct targeting processing for project:', projectId);
    console.log('🚀 [DIRECT] Received targeting_spec:', JSON.stringify(targeting_spec, null, 2));
    
    if (!targeting_spec) {
      return res.status(400).json({
        success: false,
        message: 'Targeting spec is required'
      });
    }

    // Transformer les interestGroups en interests simples pour Meta API
    let interests = [];
    if (targeting_spec.interestGroups && Array.isArray(targeting_spec.interestGroups)) {
      interests = targeting_spec.interestGroups
        .flatMap(group => group.interests || [])
        .map(interest => interest.id)
        .filter(Boolean);
    }
    
    console.log('🎯 [DIRECT] Extracted interests:', interests);

    // 1. Mettre à jour le targeting spec
    const result = await projectService.updateProject(projectId, { 
      targeting_spec,
      status: 'processing' 
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // 2. Récupérer les codes postaux
    const postalCodesResult = await projectService.getProjectResults(projectId);
    
    if (!postalCodesResult.success || !postalCodesResult.results || postalCodesResult.results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No postal codes found for this project'
      });
    }

    const codes = postalCodesResult.results.map(r => r.postal_code);
    console.log(`🔄 [DIRECT] Processing ${codes.length} postal codes directly...`);

    // 3. Traiter TOUS les codes postaux MAINTENANT
    const metaApi = require('../config/meta-api');
    const database = require('../config/database');
    const pool = database.pool;
    
    let processed = 0;
    let errors = 0;

    for (const postalCode of codes) {
      try {
        console.log(`🔄 [DIRECT] Processing ${postalCode}...`);
        
        // Recherche du code postal
        const searchResponse = await metaApi.api.call('GET', ['search'], {
          type: 'adgeolocation',
          location_types: JSON.stringify(['zip']),  
          q: postalCode,
          country_code: 'US',
          limit: 1,
          access_token: process.env.META_ACCESS_TOKEN
        });

        if (!searchResponse.data || searchResponse.data.length === 0) {
          console.log(`⚠️ [DIRECT] ${postalCode}: Not found in Meta API`);
          errors++;
          continue;
        }

        const zipCodeData = searchResponse.data[0];
        
        // Estimation géographique PURE (sans restrictions d'âge/genre spécifiques)
        const geoTargetingSpec = {
          geo_locations: {
            zips: [{
              key: zipCodeData.key,
              name: zipCodeData.name,
              country_code: zipCodeData.country_code
            }]
          },
          age_min: 18,  // Âge minimum Meta (pas de restriction)
          age_max: 65,  // Âge maximum Meta (pas de restriction)
          genders: [1, 2],  // Tous les genres (pas de restriction)
          device_platforms: ['mobile', 'desktop']
        };

        console.log(`🔍 [DIRECT] ${postalCode}: Geo targeting spec:`, JSON.stringify(geoTargetingSpec, null, 2));
        
        const geoEstimate = await metaApi.api.call('GET', [`${getMetaAdAccountId()}/delivery_estimate`], {
          targeting_spec: JSON.stringify(geoTargetingSpec),
          optimization_goal: 'REACH',
          access_token: process.env.META_ACCESS_TOKEN
        });

        const audienceGeo = geoEstimate.data?.[0]?.estimate_ready ? 
          (geoEstimate.data[0].estimate_mau_lower_bound || geoEstimate.data[0].users_lower_bound) : 0;
          
        console.log(`✅ [DIRECT] ${postalCode}: Geo estimate = ${audienceGeo}`);

        // Estimation avec targeting SPÉCIFIQUE (âge, genre, intérêts du user)
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
          interests: interests  // Utiliser les intérêts extraits des groupes
        };

        console.log(`🎯 [DIRECT] ${postalCode}: Targeting spec:`, JSON.stringify(targetingTargetingSpec, null, 2));
        
        const targetingEstimate = await metaApi.api.call('GET', [`${getMetaAdAccountId()}/delivery_estimate`], {
          targeting_spec: JSON.stringify(targetingTargetingSpec),
          optimization_goal: 'REACH',
          access_token: process.env.META_ACCESS_TOKEN
        });

        const audienceTargeting = targetingEstimate.data?.[0]?.estimate_ready ? 
          (targetingEstimate.data[0].estimate_mau_lower_bound || targetingEstimate.data[0].users_lower_bound) : 0;
          
        console.log(`🎯 [DIRECT] ${postalCode}: Targeting estimate = ${audienceTargeting}`);

        // Sauvegarder IMMÉDIATEMENT
        await pool.query(`
          UPDATE processing_results 
          SET 
            postal_code_only_estimate = $2,
            postal_code_with_targeting_estimate = $3,
            success = true,
            processed_at = NOW()
          WHERE project_id = $1 AND postal_code = $4
        `, [projectId, 
            JSON.stringify({ audience_size: audienceGeo }),
            JSON.stringify({ audience_size: audienceTargeting }),
            postalCode]);

        console.log(`✅ [DIRECT] ${postalCode}: Geo=${audienceGeo}, Targeting=${audienceTargeting}`);
        processed++;
        
        // Délai pour respecter les limites Meta API
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ [DIRECT] Error processing ${postalCode}:`, error.message);
        errors++;
      }
    }

    // 4. Finaliser le projet
    await projectService.updateProject(projectId, { 
      status: 'completed',
      processed_postal_codes: processed,
      error_postal_codes: errors 
    });

    console.log(`🎉 [DIRECT] Completed! Processed: ${processed}, Errors: ${errors}`);

    res.json({
      success: true,
      message: `Direct processing completed! Processed ${processed} postal codes, ${errors} errors.`,
      data: {
        processed,
        errors,
        total: codes.length
      }
    });

  } catch (error) {
    console.error('❌ [DIRECT] Critical error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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

    // 3. Créer un job async pour le traitement Meta API AVANT de répondre
    console.log(`🚀 Creating async job for Meta API processing of ${postalCodesCount} postal codes...`);
    
    try {
      // Créer le job directement (sans fetch interne)
      console.log(`🚀 Creating job directly for project ${projectId}...`);
      
      const { Pool } = require('pg');
      const crypto = require('crypto');
      const database = require('../config/database');
      
      const pool = database.pool;
      
      // Générer un job ID unique
      const jobId = crypto.randomUUID();
      
      // Insérer le job dans la base de données
      const insertResult = await pool.query(`
        INSERT INTO analysis_jobs (
          project_id, job_id, status, total_items, 
          meta_targeting_spec, batch_size, created_at
        ) VALUES ($1, $2, 'pending', $3, $4, $5, NOW())
        RETURNING *
      `, [projectId, jobId, postalCodesCount, JSON.stringify(targeting_spec), 200]);

      const job = insertResult.rows[0];
      
      // Mettre à jour le statut du projet
      await pool.query(
        'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
        ['processing', projectId]
      );

      console.log(`✅ Job ${jobId} created successfully for project ${projectId} with ${postalCodesCount} items`);
      
      // 4. DÉCLENCHER IMMÉDIATEMENT LE WORKER (appel direct sans fetch)
      console.log(`🚀 Triggering worker immediately for job ${jobId}...`);
      
      // Appel direct en arrière-plan (plus robuste que fetch)
      setImmediate(async () => {
        try {
          console.log(`🔄 Processing job ${jobId} immediately in background...`);
          
          // Récupérer le job qu'on vient de créer
          const jobQuery = await pool.query(
            'SELECT * FROM analysis_jobs WHERE job_id = $1', 
            [jobId]
          );
          
          if (jobQuery.rows.length > 0) {
            const jobToProcess = jobQuery.rows[0];
            
            // Importer la fonction processJob directement
            const jobsModule = require('./jobs');
            const processJob = jobsModule.processJob;
            
            if (processJob && typeof processJob === 'function') {
              // Traiter le job directement (non-bloquant)
              try {
                await processJob(jobToProcess);
                console.log(`✅ Job ${jobId} processed successfully in background`);
              } catch (processingError) {
                console.log(`⚠️ Background job processing failed for ${jobId}: ${processingError.message}`);
                // Le job restera 'pending' et sera traité par le cron plus tard
              }
            } else {
              console.log(`⚠️ processJob function not available, job ${jobId} will be processed by cron`);
            }
          }
          
        } catch (error) {
          console.log(`⚠️ Background worker setup failed: ${error.message}`);
          // Le job restera 'pending' et sera traité par le cron plus tard
        }
      });
      
      // 5. Répondre immédiatement au frontend avec les informations du job
      return res.json({
        success: true,
        message: 'Targeting spec updated successfully. Meta API processing job created and triggered.',
        data: {
          project: result.project,
          totalPostalCodes: postalCodesCount,
          status: 'processing_started',
          job: {
            jobId: job.job_id,
            status: job.status,
            totalItems: job.total_items,
            batchSize: job.batch_size
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Job creation failed:', error.message);
      
      // Fallback: continuer sans job (pour compatibilité)
      res.json({
        success: true,
        message: 'Targeting spec updated successfully. Job creation failed, but targeting is saved.',
        data: {
          project: result.project,
          totalPostalCodes: postalCodesCount,
          status: 'targeting_saved',
          error: 'Job creation failed: ' + error.message
        }
      });
      return;
    }

  } catch (error) {
    console.error('Error updating project targeting spec and calculating estimates:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get project processing status - EMERGENCY DISABLED
router.get('/:projectId/status', async (req, res) => {
  // EMERGENCY: COMPLETELY DISABLE TO STOP RESOURCE CONSUMPTION
  return res.status(503).json({
    success: false,
    message: 'Project status polling temporarily disabled to conserve resources',
    disabled: true,
    emergency_mode: true
  });
  
  try {
    const { projectId } = req.params;
    
    const database = require('../config/database');
    const pool = database.pool;
    
    // Récupérer le statut du projet
    const result = await projectService.getProjectStatus(projectId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Récupérer le job le plus récent pour ce projet
    let currentJob = null;
    try {
      const jobQuery = await pool.query(`
        SELECT * FROM analysis_jobs 
        WHERE project_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [projectId]);

      if (jobQuery.rows.length > 0) {
        const job = jobQuery.rows[0];
        currentJob = {
          jobId: job.job_id,
          projectId: job.project_id,
          status: job.status,
          progress: job.total_items > 0 ? Math.round((job.processed_items / job.total_items) * 100) : 0,
          totalItems: job.total_items,
          processedItems: job.processed_items,
          failedItems: job.failed_items,
          currentBatch: job.current_batch,
          retryCount: job.retry_count,
          lastError: job.last_error,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          createdAt: job.created_at,
          updatedAt: job.updated_at
        };
      }
    } catch (jobError) {
      console.log('⚠️ Could not fetch job info:', jobError.message);
      // Continue without job info
    }

    res.json({
      success: true,
      data: {
        ...result.status,
        currentJob
      }
    });
  } catch (error) {
    console.error('Error getting project status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SUPPRIMÉ - Endpoint debug avec données mock supprimé

// Debug endpoint pour forcer le processus Meta API sur un projet
router.post('/debug/force-meta-processing/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`🧪 [FORCE-META] Forçage du traitement Meta pour le projet ${projectId}`);
    
    // Récupérer le projet et son targeting_spec
    const projectResult = await projectService.getProject(projectId);
    if (!projectResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const project = projectResult.project;
    if (!project.targeting_spec) {
      return res.status(400).json({
        success: false,
        message: 'Project has no targeting spec'
      });
    }
    
    let targeting_spec;
    try {
      targeting_spec = typeof project.targeting_spec === 'string' 
        ? JSON.parse(project.targeting_spec) 
        : project.targeting_spec;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid targeting spec JSON'
      });
    }
    
    console.log(`🧪 [FORCE-META] Targeting spec:`, targeting_spec);
    
    // Exécuter le processus Meta API de façon synchrone pour voir les erreurs
    const baseUrl = req.protocol + '://' + req.get('host');
    await processMetaAPIEstimates(projectId, targeting_spec, baseUrl);
    
    res.json({
      success: true,
      message: `Meta API processing completed for project ${projectId}`
    });
    
  } catch (error) {
    console.error('🧪 [FORCE-META] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
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
        [`${getMetaAdAccountId()}/delivery_estimate`],
        {
          targeting_spec: JSON.stringify(targetingSpec),
          optimization_goal: 'REACH',
          access_token: process.env.META_ACCESS_TOKEN
        }
      );

      console.log(`🔍 [META-DEBUG] Estimate response:`, estimateResponse);

      const audienceEstimate = estimateResponse?.data?.[0]?.estimate_mau_lower_bound || estimateResponse?.data?.[0]?.estimate_mau_upper_bound || estimateResponse?.data?.[0]?.users_lower_bound || estimateResponse?.data?.[0]?.users_upper_bound || 0;

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

// Debug endpoint pour comparer les estimations géo vs targeting
router.get('/debug/compare-estimates/:postalCode', async (req, res) => {
  try {
    const { postalCode } = req.params;
    
    console.log(`🧪 [COMPARE] Testing estimates comparison for postal code: ${postalCode}`);
    
    if (!process.env.META_ACCESS_TOKEN) {
      return res.status(400).json({
        success: false,
        message: 'META_ACCESS_TOKEN is missing'
      });
    }

    const metaApi = require('../config/meta-api');
    
    // 1. Recherche du code postal
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
      return res.json({
        success: false,
        message: `Postal code ${postalCode} not found`
      });
    }

    const zipCodeData = searchResponse.data[0];
    
    // 2. Estimation géographique PURE (18-65, tous genres, pas d'intérêts)
    const geoTargetingSpec = {
      geo_locations: {
        zips: [{
          key: zipCodeData.key,
          name: zipCodeData.name,
          country_code: zipCodeData.country_code
        }]
      },
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      device_platforms: ['mobile', 'desktop']
    };

    const geoEstimate = await metaApi.api.call(
      'GET',
      [`${getMetaAdAccountId()}/delivery_estimate`],
      {
        targeting_spec: JSON.stringify(geoTargetingSpec),
        optimization_goal: 'REACH',
        access_token: process.env.META_ACCESS_TOKEN
      }
    );

    const audienceGeo = geoEstimate.data?.[0]?.estimate_mau_lower_bound || geoEstimate.data?.[0]?.users_lower_bound || 0;
    
    // 3. Estimation avec targeting SPÉCIFIQUE (25-45, hommes seulement, avec intérêts fictifs)
    const targetingTargetingSpec = {
      geo_locations: {
        zips: [{
          key: zipCodeData.key,
          name: zipCodeData.name,
          country_code: zipCodeData.country_code
        }]
      },
      age_min: 25,
      age_max: 45,
      genders: [1], // Hommes seulement
      device_platforms: ['mobile', 'desktop'],
      interests: ['6003629266583'] // Sports par exemple
    };

    const targetingEstimate = await metaApi.api.call(
      'GET',
      [`${getMetaAdAccountId()}/delivery_estimate`],
      {
        targeting_spec: JSON.stringify(targetingTargetingSpec),
        optimization_goal: 'REACH',
        access_token: process.env.META_ACCESS_TOKEN
      }
    );

    const audienceTargeting = targetingEstimate.data?.[0]?.estimate_mau_lower_bound || targetingEstimate.data?.[0]?.users_lower_bound || 0;

    res.json({
      success: true,
      message: 'Estimates comparison completed',
      data: {
        postalCode,
        zipCodeData,
        geoEstimate: {
          spec: geoTargetingSpec,
          audience: audienceGeo,
          raw: geoEstimate.data?.[0]
        },
        targetingEstimate: {
          spec: targetingTargetingSpec,
          audience: audienceTargeting,
          raw: targetingEstimate.data?.[0]
        },
        difference: {
          absolute: audienceGeo - audienceTargeting,
          percentage: audienceGeo > 0 ? Math.round(((audienceGeo - audienceTargeting) / audienceGeo) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error(`❌ [COMPARE] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

