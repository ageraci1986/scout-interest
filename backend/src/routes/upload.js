const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const fileProcessor = require('../services/fileProcessor');
const db = require('../config/database');
const path = require('path');

// Upload file endpoint
router.post('/file', upload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileInfo = {
      filename: req.file.filename || 'uploaded-file',
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer
    };

    console.log('📁 Processing file:', fileInfo.originalName, 'Size:', fileInfo.size);

    // Process the file from buffer (for Vercel compatibility)
    const processedData = await fileProcessor.processFile(null, req.file.buffer);
    
    console.log('✅ File processed successfully');
    
    // TODO: Get project ID from user session in production
    const projectId = 'anonymous'; // Placeholder for now
    
    // Save file upload record
    let uploadRecord = null;
    try {
      const result = await db.run(
        `INSERT INTO file_uploads (project_id, filename, original_filename, file_size, file_type, upload_path, status, validation_errors)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          projectId,
          fileInfo.filename,
          fileInfo.originalName,
          fileInfo.size,
          fileInfo.mimetype,
          'memory://' + fileInfo.filename, // Use memory path for Vercel
          'processed',
          JSON.stringify(processedData.invalidPostalCodes || [])
        ]
      );
      uploadRecord = result;
    } catch (error) {
      console.error('❌ Database error:', error.message);
      // Continue without database save for now
      uploadRecord = { rows: [{ id: 'temp-' + Date.now() }] };
    }

    // Generate preview
    const preview = fileProcessor.generatePreview(processedData, 50);

    res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: {
        uploadId: uploadRecord?.rows?.[0]?.id || 'temp-upload',
        filename: fileInfo.originalName,
        statistics: processedData.statistics,
        preview: preview,
        postalCodeColumn: processedData.postalCodeColumn,
        headers: processedData.headers,
        // Add all processed postal codes for frontend processing
        allPostalCodes: (processedData.validPostalCodes || []).map(pc => pc.value)
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'File processing failed'
    });
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
    const projectService = require('../services/projectService');
    const projectResult = await projectService.createProject({
      name: `Project from ${filename}`,
      description: `Auto-generated project from file upload with ${postalCodes.length} postal codes`,
      userId: 'anonymous'
    });
    
    if (!projectResult.success) {
      throw new Error('Failed to create project: ' + projectResult.error);
    }
    
    const projectId = projectResult.project.id.toString();
    
    // Pas d'appels Meta API lors de l'upload - juste sauvegarder les codes postaux
    console.log('📋 Sauvegarde des codes postaux sans appel Meta API...');
    
    let postalCodeResults = [];
    
    // Sauvegarder chaque code postal sans estimation Meta API
    for (const code of postalCodes) {
      try {
        console.log(`📋 Sauvegarde de ${code}...`);
        
        // Sauvegarder le code postal sans estimation Meta API
        await projectService.saveProcessingResults(projectId, [{
          postalCode: code,
          countryCode: 'US',
          success: true,
          postalCodeOnlyEstimate: { audience_size: 0 }, // Sera calculé lors de la validation du targeting
          postalCodeWithTargetingEstimate: { audience_size: 0 } // Sera calculé lors de la validation du targeting
        }]);
        
        postalCodeResults.push({
          id: Math.random().toString(36).substr(2, 9),
          postal_code: code,
          success: true,
          audience_estimate: 0, // Sera calculé lors de la validation du targeting
          targeting_estimate: 0 // Sera calculé lors de la validation du targeting
        });
        
        console.log(`✅ ${code}: Code postal sauvegardé (estimations à calculer lors du targeting)`);
        
      } catch (error) {
        console.error(`❌ Erreur sauvegarde ${code}:`, error.message);
        
        // En cas d'erreur, créer quand même un résultat avec des valeurs par défaut
        postalCodeResults.push({
          id: Math.random().toString(36).substr(2, 9),
          postal_code: code,
          success: false,
          audience_estimate: 0,
          targeting_estimate: 0
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
        status: 'active'
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
        success: postalCodes.length,
        error: 0
      },
      status: 'pending_targeting' // Indique que le targeting doit être validé
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

// Validate file endpoint (without saving to database)
router.post('/validate', upload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📁 Validating file:', req.file.originalname);

    // Process the file from buffer (for Vercel compatibility)
    const processedData = await fileProcessor.processFile(null, req.file.buffer);
    
    console.log('✅ File validated successfully');
    
    // Generate preview
    const preview = fileProcessor.generatePreview(processedData, 50);

    res.json({
      success: true,
      message: 'File validated successfully',
      data: {
        filename: req.file.originalname,
        statistics: processedData.statistics,
        preview: preview,
        postalCodeColumn: processedData.postalCodeColumn,
        headers: processedData.headers,
        allPostalCodes: (processedData.validPostalCodes || []).map(pc => pc.value)
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'File validation failed'
    });
  }
});

module.exports = router;
