const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const fileProcessor = require('../services/fileProcessor');
const db = require('../config/database');
// Import queue with fallback
let uploadQueue;
try {
  const queueConfig = require('../config/queue');
  uploadQueue = queueConfig.uploadQueue;
} catch (error) {
  console.log('⚠️  Queue not available, using mock queue...');
  uploadQueue = {
    add: async (name, data, options) => {
      console.log(`Mock queue job: ${name}`, data);
      return { id: 'mock-job-id' };
    }
  };
}
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

    const filePath = req.file.path;
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: filePath
    };

    // Process the file
    const processedData = await fileProcessor.processFile(filePath);
    
    // Create a mock project for now (in real app, this would come from user session)
    const projectId = 1; // TODO: Get from user session
    
    // Save file upload record (mock for now)
    const uploadRecord = { rows: [{ id: 1 }] };
    try {
      const result = await db.query(
        `INSERT INTO file_uploads (project_id, filename, original_filename, file_size, file_type, upload_path, status, validation_errors)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          projectId,
          fileInfo.filename,
          fileInfo.originalName,
          fileInfo.size,
          fileInfo.mimetype,
          fileInfo.path,
          'processed',
          JSON.stringify(processedData.invalidPostalCodes)
        ]
      );
      uploadRecord.rows = result.rows;
    } catch (error) {
      console.log('⚠️  Database not available, using mock data...');
    }

    // Generate preview
    const preview = fileProcessor.generatePreview(processedData);

    res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: {
        uploadId: uploadRecord.rows[0].id,
        filename: fileInfo.originalName,
        statistics: processedData.statistics,
        preview: preview,
        postalCodeColumn: processedData.postalCodeColumn,
        headers: processedData.headers,
        // Add all processed postal codes for frontend processing
        allPostalCodes: processedData.validPostalCodes.map(pc => pc.value)
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if it was uploaded
    if (req.file) {
      await fileProcessor.cleanupFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message
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

    const filePath = req.file.path;
    
    // Process the file
    const processedData = await fileProcessor.processFile(filePath);
    
    // Generate preview
    const preview = fileProcessor.generatePreview(processedData);

    // Clean up the file after validation
    await fileProcessor.cleanupFile(filePath);

    res.json({
      success: true,
      message: 'File validated successfully',
      data: {
        filename: req.file.originalname,
        statistics: processedData.statistics,
        preview: preview,
        postalCodeColumn: processedData.postalCodeColumn,
        headers: processedData.headers,
        invalidPostalCodes: processedData.invalidPostalCodes.slice(0, 10), // First 10 errors
        duplicates: processedData.duplicates.slice(0, 10), // First 10 duplicates
        // Add all processed postal codes for frontend processing
        allPostalCodes: processedData.validPostalCodes.map(pc => pc.value)
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    
    // Clean up file if it was uploaded
    if (req.file) {
      await fileProcessor.cleanupFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Save validated data to database
router.post('/save/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Get upload record
    const uploadRecord = await db.query(
      'SELECT * FROM file_uploads WHERE id = $1',
      [uploadId]
    );

    if (uploadRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Upload record not found'
      });
    }

    const upload = uploadRecord.rows[0];

    // Process the file again to get the data
    const processedData = await fileProcessor.processFile(upload.upload_path);
    
    // Save to database
    const saveResult = await fileProcessor.saveToDatabase(projectId, processedData, db);

    // Update project with postal code count
    await db.query(
      'UPDATE projects SET total_postal_codes = $1 WHERE id = $2',
      [processedData.statistics.valid, projectId]
    );

    // Update upload status
    await db.query(
      'UPDATE file_uploads SET status = $1 WHERE id = $2',
      ['saved', uploadId]
    );

    // Add job to queue for analysis
    const job = await uploadQueue.add('process-upload', {
      projectId,
      uploadId,
      postalCodes: processedData.validPostalCodes.map(pc => pc.value)
    }, {
      delay: 1000 // 1 second delay
    });

    res.json({
      success: true,
      message: 'Data saved successfully',
      data: {
        projectId,
        savedCount: saveResult.savedCount,
        jobId: job.id,
        statistics: processedData.statistics
      }
    });

  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get upload status
router.get('/status/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;

    const uploadRecord = await db.query(
      'SELECT * FROM file_uploads WHERE id = $1',
      [uploadId]
    );

    if (uploadRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Upload record not found'
      });
    }

    res.json({
      success: true,
      data: uploadRecord.rows[0]
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Store uploaded postal codes temporarily
router.post('/store-postal-codes', async (req, res) => {
  try {
    const { postalCodes, sessionId } = req.body;
    
    if (!postalCodes || !Array.isArray(postalCodes) || postalCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'postalCodes array is required and must not be empty'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    console.log(`📦 Storing ${postalCodes.length} postal codes for session ${sessionId}`);

    // Store in memory (in production, you'd use Redis or database)
    if (!global.tempPostalCodes) {
      global.tempPostalCodes = new Map();
    }

    global.tempPostalCodes.set(sessionId, {
      postalCodes,
      timestamp: Date.now(),
      count: postalCodes.length
    });

    res.json({
      success: true,
      data: {
        sessionId,
        storedCount: postalCodes.length,
        message: 'Postal codes stored successfully'
      }
    });

  } catch (error) {
    console.error('Error storing postal codes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Retrieve stored postal codes
router.get('/get-postal-codes/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    console.log(`📦 Retrieving postal codes for session ${sessionId}`);

    if (!global.tempPostalCodes || !global.tempPostalCodes.has(sessionId)) {
      return res.status(404).json({
        success: false,
        message: 'No postal codes found for this session'
      });
    }

    const storedData = global.tempPostalCodes.get(sessionId);
    
    // Check if data is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - storedData.timestamp > maxAge) {
      global.tempPostalCodes.delete(sessionId);
      return res.status(410).json({
        success: false,
        message: 'Stored postal codes have expired'
      });
    }

    res.json({
      success: true,
      data: {
        postalCodes: storedData.postalCodes,
        count: storedData.count,
        timestamp: storedData.timestamp
      }
    });

  } catch (error) {
    console.error('Error retrieving postal codes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clean up old stored postal codes
router.post('/cleanup-postal-codes', async (req, res) => {
  try {
    if (!global.tempPostalCodes) {
      return res.json({
        success: true,
        data: {
          cleanedCount: 0,
          message: 'No stored postal codes to clean up'
        }
      });
    }

    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, data] of global.tempPostalCodes.entries()) {
      if (now - data.timestamp > maxAge) {
        global.tempPostalCodes.delete(sessionId);
        cleanedCount++;
      }
    }

    console.log(`🧹 Cleaned up ${cleanedCount} expired postal code sessions`);

    res.json({
      success: true,
      data: {
        cleanedCount,
        remainingSessions: global.tempPostalCodes.size,
        message: 'Cleanup completed successfully'
      }
    });

  } catch (error) {
    console.error('Error cleaning up postal codes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Error handling middleware
router.use(handleUploadError);

module.exports = router;
