const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileProcessor = require('../services/fileProcessor');
const projectService = require('../services/projectService');

// Configuration multer pour Vercel (pas de stockage de fichiers)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// JSON upload endpoint for frontend compatibility
router.post('/file/json', async (req, res) => {
  try {
    const { filename, postalCodes } = req.body;
    
    console.log('📤 JSON Upload received:', { filename, postalCodesCount: postalCodes?.length || 0 });
    
    // Validation des données
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }
    
    if (!postalCodes || !Array.isArray(postalCodes) || postalCodes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'postalCodes must be a non-empty array'
      });
    }
    
    // Créer un vrai projet dans Supabase
    const projectResult = await projectService.createProject({
      name: `Project from ${filename}`,
      description: `Auto-generated project from file upload with ${postalCodes.length} postal codes`,
      userId: 'anonymous'
    });
    
    if (!projectResult.success) {
      throw new Error('Failed to create project: ' + projectResult.error);
    }
    
    const projectId = projectResult.project.id.toString();
    
    // Sauvegarder les codes postaux uniquement - Meta API sera appelé lors de la validation targeting
    console.log('💾 Saving postal codes to database...');
    
    let postalCodeResults = [];
    
    // Sauvegarder chaque code postal dans la base de données
    for (const code of postalCodes) {
      try {
        console.log(`💾 Saving postal code ${code}...`);
        
        // Sauvegarder le code postal dans Supabase (sans estimations Meta API)
        await projectService.saveProcessingResults(projectId, [{
          postalCode: code,
          countryCode: 'US',
          success: true,
          postalCodeOnlyEstimate: { audience_size: 0 }, // Sera rempli lors du targeting
          postalCodeWithTargetingEstimate: { audience_size: 0 } // Sera rempli lors du targeting
        }]);
        
        postalCodeResults.push({
          id: Math.random().toString(36).substr(2, 9),
          postal_code: code,
          success: true,
          audience_estimate: 0, // Sera calculé lors du targeting
          targeting_estimate: 0 // Sera calculé lors du targeting
        });
        
        console.log(`✅ Postal code ${code} saved successfully`);
        
      } catch (error) {
        console.error(`❌ Error saving postal code ${code}:`, error.message);
        
        postalCodeResults.push({
          id: Math.random().toString(36).substr(2, 9),
          postal_code: code,
          success: false,
          audience_estimate: 0,
          targeting_estimate: 0,
          error: error.message
        });
      }
    }
    
    // Mettre à jour le projet avec les vraies statistiques
    try {
      const successfulCount = postalCodeResults.filter(r => r.success).length;
      const errorCount = postalCodeResults.filter(r => !r.success).length;
      
      await projectService.updateProject(projectId, {
        total_postal_codes: postalCodes.length,
        processed_postal_codes: successfulCount,
        error_postal_codes: errorCount,
        status: 'pending' // En attente de validation targeting
      });
      
      console.log(`✅ Project updated: ${successfulCount} successful, ${errorCount} errors`);
    } catch (error) {
      console.error('❌ Error updating project stats:', error);
    }
    
    const results = postalCodeResults;
    
    console.log('✅ JSON Upload processed successfully');
    
    // Retourner la structure attendue par le frontend
    res.json({
      success: true,
      message: 'File uploaded successfully. Postal codes saved. Meta API estimates will be calculated when you validate targeting.',
      project_id: projectId,
      results: results,
      summary: {
        total: postalCodes.length,
        success: postalCodeResults.filter(r => r.success).length,
        error: postalCodeResults.filter(r => !r.success).length
      }
    });
    
  } catch (error) {
    console.error('JSON Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message || 'Unknown error'
    });
  }
});

module.exports = router;
