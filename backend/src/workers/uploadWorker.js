const { uploadQueue } = require('../config/queue');
const fileProcessor = require('../services/fileProcessor');
const db = require('../config/database');
const io = require('socket.io');

// Process upload jobs
uploadQueue.process('process-upload', async (job) => {
  const { projectId, uploadId, postalCodes } = job.data;
  
  console.log(`🔄 Processing upload job ${job.id} for project ${projectId}`);
  
  try {
    // Update job status
    await job.progress(10);
    
    // Get upload record
    const uploadRecord = await db.query(
      'SELECT * FROM file_uploads WHERE id = $1',
      [uploadId]
    );
    
    if (uploadRecord.rows.length === 0) {
      throw new Error('Upload record not found');
    }
    
    const upload = uploadRecord.rows[0];
    
    // Update job status
    await job.progress(30);
    
    // Process the file
    const processedData = await fileProcessor.processFile(upload.upload_path);
    
    // Update job status
    await job.progress(60);
    
    // Save to database
    const saveResult = await fileProcessor.saveToDatabase(projectId, processedData, db);
    
    // Update project with postal code count
    await db.query(
      'UPDATE projects SET total_postal_codes = $1, processed_postal_codes = 0 WHERE id = $2',
      [processedData.statistics.valid, projectId]
    );
    
    // Update upload status
    await db.query(
      'UPDATE file_uploads SET status = $1 WHERE id = $2',
      ['completed', uploadId]
    );
    
    // Update job status
    await job.progress(100);
    
    console.log(`✅ Upload job ${job.id} completed successfully`);
    
    return {
      success: true,
      projectId,
      uploadId,
      savedCount: saveResult.savedCount,
      statistics: processedData.statistics
    };
    
  } catch (error) {
    console.error(`❌ Upload job ${job.id} failed:`, error);
    
    // Update upload status to failed
    await db.query(
      'UPDATE file_uploads SET status = $1 WHERE id = $2',
      ['failed', uploadId]
    );
    
    throw error;
  }
});

// Handle job completion
uploadQueue.on('completed', (job, result) => {
  console.log(`✅ Upload job ${job.id} completed:`, result);
  
  // Emit socket event if io is available
  if (global.io) {
    global.io.to(`project-${result.projectId}`).emit('upload-completed', {
      jobId: job.id,
      uploadId: result.uploadId,
      statistics: result.statistics
    });
  }
});

// Handle job failure
uploadQueue.on('failed', (job, err) => {
  console.error(`❌ Upload job ${job.id} failed:`, err.message);
  
  // Emit socket event if io is available
  if (global.io) {
    global.io.to(`project-${job.data.projectId}`).emit('upload-failed', {
      jobId: job.id,
      uploadId: job.data.uploadId,
      error: err.message
    });
  }
});

// Handle job progress
uploadQueue.on('progress', (job, progress) => {
  console.log(`📊 Upload job ${job.id} progress: ${progress}%`);
  
  // Emit socket event if io is available
  if (global.io) {
    global.io.to(`project-${job.data.projectId}`).emit('upload-progress', {
      jobId: job.id,
      uploadId: job.data.uploadId,
      progress
    });
  }
});

module.exports = uploadQueue;
