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

// Mettre à jour le targeting spec d'un projet ET calculer les estimations Meta API
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

    // 2. Récupérer les codes postaux du projet depuis la base de données
    const postalCodesResult = await projectService.getProjectResults(projectId);
    
    if (!postalCodesResult.success || !postalCodesResult.results || postalCodesResult.results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No postal codes found for this project'
      });
    }

    const postalCodes = postalCodesResult.results.map(r => r.postal_code);
    console.log(`🚀 Calcul des estimations Meta API pour ${postalCodes.length} codes postaux...`);

    // 3. Calculer les estimations Meta API pour chaque code postal
    const axios = require('axios');
    const baseUrl = req.protocol + '://' + req.get('host');
    const metaUrl = `${baseUrl}/api/meta/postal-code-reach-estimate-v2`;

    const updatedResults = [];

    for (const postalCode of postalCodes) {
      try {
        console.log(`🔍 Calcul estimation pour ${postalCode}...`);

        // 1. Premier appel Meta API : Code postal seul (estimation géographique)
        const geoResponse = await axios.post(
          metaUrl,
          {
            adAccountId: process.env.META_AD_ACCOUNT_ID || 'act_379481728925498',
            postalCode: postalCode,
            targetingSpec: {
              age_min: targeting_spec.age_min || 18,
              age_max: targeting_spec.age_max || 65,
              genders: targeting_spec.genders || [1, 2],
              // Pas d'intérêts pour l'estimation géographique
            }
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (geoResponse.data?.success && geoResponse.data?.data?.reachEstimate) {
          const geoReachData = geoResponse.data.data.reachEstimate;
          const audienceEstimate = geoReachData.users_lower_bound || geoReachData.users_upper_bound || 0;
          
          console.log(`✅ ${postalCode}: Estimation géographique = ${audienceEstimate}`);
          
          // 2. Deuxième appel Meta API : Code postal + targeting (estimation avec targeting)
          const targetingResponse = await axios.post(
            metaUrl,
            {
              adAccountId: process.env.META_AD_ACCOUNT_ID || 'act_379481728925498',
              postalCode: postalCode,
              targetingSpec: {
                age_min: targeting_spec.age_min || 18,
                age_max: targeting_spec.age_max || 65,
                genders: targeting_spec.genders || [1, 2],
                interests: targeting_spec.interests || [],
                countries: targeting_spec.countries || ['US']
              }
            },
            { headers: { 'Content-Type': 'application/json' } }
          );

          let targetingEstimate = audienceEstimate; // Valeur par défaut

          if (targetingResponse.data?.success && targetingResponse.data?.data?.reachEstimate) {
            const targetingReachData = targetingResponse.data.data.reachEstimate;
            targetingEstimate = targetingReachData.users_lower_bound || targetingReachData.users_upper_bound || 0;
            console.log(`✅ ${postalCode}: Estimation avec targeting = ${targetingEstimate}`);
          } else {
            console.warn(`⚠️ ${postalCode}: Impossible d'obtenir l'estimation avec targeting, utilisation de l'estimation géographique`);
          }

          console.log(`✅ ${postalCode}: audience=${audienceEstimate}, targeting=${targetingEstimate}`);

          // Mettre à jour le résultat existant dans la base au lieu d'en créer un nouveau
          await projectService.updateProcessingResult(projectId, postalCode, {
            success: true,
            postalCodeOnlyEstimate: { audience_size: audienceEstimate },
            postalCodeWithTargetingEstimate: { audience_size: targetingEstimate }
          });

          updatedResults.push({
            postal_code: postalCode,
            success: true,
            audience_estimate: audienceEstimate,
            targeting_estimate: targetingEstimate
          });

        } else {
          console.error(`❌ ${postalCode}: Réponse Meta API invalide`);
          
          // En cas d'échec, marquer comme échec et continuer
          updatedResults.push({
            postal_code: postalCode,
            success: false,
            audience_estimate: 0,
            targeting_estimate: 0,
            error: 'Invalid Meta API response'
          });
        }

        // Délai entre les appels pour respecter les rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Erreur calcul estimation ${postalCode}:`, error.message);
        
        // En cas d'erreur, garder les valeurs par défaut
        updatedResults.push({
          postal_code: postalCode,
          success: false,
          audience_estimate: 0,
          targeting_estimate: 0,
          error: error.message
        });
      }
    }

    console.log(`✅ Estimations Meta API calculées pour ${updatedResults.length} codes postaux`);

    // 4. Mettre à jour le statut du projet
    await projectService.updateProject(projectId, { 
      status: 'completed',
      processed_postal_codes: updatedResults.filter(r => r.success).length,
      error_postal_codes: updatedResults.filter(r => !r.success).length
    });

    res.json({
      success: true,
      message: 'Targeting spec updated and Meta API estimates calculated successfully',
      data: {
        project: result.project,
        results: updatedResults,
        totalProcessed: updatedResults.length,
        successful: updatedResults.filter(r => r.success).length,
        errors: updatedResults.filter(r => !r.success).length
      }
    });

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

module.exports = router;

