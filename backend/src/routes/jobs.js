const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

const router = express.Router();

// Helper function pour obtenir l'ID compte Meta correctement formaté
function getMetaAdAccountId() {
  const accountId = process.env.META_AD_ACCOUNT_ID || '379481728925498';
  // Retirer le préfixe 'act_' s'il existe déjà pour éviter la duplication
  const cleanId = accountId.startsWith('act_') ? accountId.substring(4) : accountId;
  return `act_${cleanId}`;
}

// Helper function pour convertir le targeting spec du format frontend au format Meta API
function convertTargetingSpec(frontendSpec) {
  const interests = [];
  
  // Convertir interestGroups en liste d'intérêts
  if (frontendSpec.interestGroups && Array.isArray(frontendSpec.interestGroups)) {
    frontendSpec.interestGroups.forEach(group => {
      if (group.interests && Array.isArray(group.interests)) {
        group.interests.forEach(interest => {
          interests.push({ id: interest.id, name: interest.name });
        });
      }
    });
  }
  
  // Fallback vers interests direct
  if (frontendSpec.interests && Array.isArray(frontendSpec.interests)) {
    frontendSpec.interests.forEach(interest => {
      interests.push({ id: interest.id, name: interest.name });
    });
  }
  
  return {
    age_min: frontendSpec.age_min || 18,
    age_max: frontendSpec.age_max || 65,
    genders: frontendSpec.genders && frontendSpec.genders.length > 0 
      ? frontendSpec.genders.map(g => parseInt(g)) 
      : [1, 2],
    device_platforms: ['mobile', 'desktop'],
    interests: interests
  };
}

// DISABLE ALL JOB ROUTES TO STOP RESOURCE CONSUMPTION
// Use centralized database connection
const database = require('../config/database');
const pool = database.pool;

// POST /api/jobs/start - DISABLED TO STOP RESOURCE CONSUMPTION
router.post('/start', async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Job processing temporarily disabled to conserve resources',
    disabled: true
  });
  
  try {
    const { projectId, targetingSpec } = req.body;

    if (!projectId || !targetingSpec) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, targetingSpec'
      });
    }

    // Generate unique job ID
    const jobId = crypto.randomUUID();

    // Count postal codes for this project
    const postalCodesResult = await pool.query(
      'SELECT COUNT(*) as count FROM processing_results WHERE project_id = $1',
      [projectId]
    );
    const totalItems = parseInt(postalCodesResult.rows[0].count);

    if (totalItems === 0) {
      return res.status(400).json({
        success: false,
        message: 'No postal codes found for this project'
      });
    }

    // Create the job record
    const insertResult = await pool.query(`
      INSERT INTO analysis_jobs (
        project_id, job_id, status, total_items, 
        meta_targeting_spec, batch_size, created_at
      ) VALUES ($1, $2, 'pending', $3, $4, $5, NOW())
      RETURNING *
    `, [projectId, jobId, totalItems, JSON.stringify(targetingSpec), 200]);

    const job = insertResult.rows[0];

    // Update project status to 'processing' 
    await pool.query(
      'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
      ['processing', projectId]
    );

    console.log(`🚀 [JOB-START] Created job ${jobId} for project ${projectId} with ${totalItems} items`);

    res.status(202).json({
      success: true,
      message: 'Meta API processing job created successfully',
      data: {
        jobId: job.job_id,
        projectId: projectId,
        status: job.status,
        totalItems: job.total_items,
        batchSize: job.batch_size,
        progress: 0
      }
    });

  } catch (error) {
    console.error('❌ [JOB-START] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
});

// GET /api/jobs/status/:jobId - Get job status and progress
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(`
      SELECT 
        aj.*,
        p.name as project_name,
        p.status as project_status
      FROM analysis_jobs aj
      JOIN projects p ON aj.project_id = p.id
      WHERE aj.job_id = $1
    `, [jobId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const job = result.rows[0];
    const progress = job.total_items > 0 ? Math.round((job.processed_items / job.total_items) * 100) : 0;

    res.json({
      success: true,
      data: {
        jobId: job.job_id,
        projectId: job.project_id,
        projectName: job.project_name,
        status: job.status,
        progress: progress,
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
      }
    });

  } catch (error) {
    console.error('❌ [JOB-STATUS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

// GET /api/jobs/pending - Get all pending jobs (for worker)
router.get('/pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM analysis_jobs 
      WHERE status IN ('pending', 'retrying')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      ORDER BY created_at ASC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ [JOB-PENDING] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending jobs',
      error: error.message
    });
  }
});

// POST /api/jobs/trigger - DISABLED TO STOP RESOURCE CONSUMPTION
router.post('/trigger', async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Job processing temporarily disabled to conserve resources',
    disabled: true
  });
  
  // POST /api/jobs/trigger - ROBUST trigger with timeout protection
  /*
  const startTime = Date.now();
  const VERCEL_TIMEOUT = 8000; // 8 seconds safety margin
  
  try {
    console.log('🔄 [TRIGGER] ROBUST job processing trigger...');

    // Quick check for pending jobs
    const pendingJobsResult = await pool.query(`
      SELECT COUNT(*) as count FROM analysis_jobs 
      WHERE status IN ('pending', 'retrying')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    `);

    const pendingCount = parseInt(pendingJobsResult.rows[0].count);
    
    if (pendingCount === 0) {
      return res.json({
        success: true,
        message: 'No pending jobs to process',
        pendingJobs: 0,
        processed: 0,
        processingTime: Date.now() - startTime
      });
    }

    // VERCEL SAFETY: Respond quickly, process in background
    res.json({
      success: true,
      message: `Processing ${pendingCount} jobs in micro-batches...`,
      pendingJobs: pendingCount,
      status: 'processing_started',
      processingTime: Date.now() - startTime
    });

    // BACKGROUND PROCESSING: Process 1 job maximum to avoid timeout
    try {
      const jobQuery = await pool.query(`
        SELECT * FROM analysis_jobs 
        WHERE status IN ('pending', 'retrying')
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY created_at ASC
        LIMIT 1
      `);

      if (jobQuery.rows.length > 0) {
        const job = jobQuery.rows[0];
        console.log(`🚀 [TRIGGER] Processing job ${job.job_id} in background...`);
        
        // Process job with timeout protection
        const processPromise = processJob(job);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Processing timeout')), VERCEL_TIMEOUT)
        );
        
        await Promise.race([processPromise, timeoutPromise]);
        console.log(`✅ [TRIGGER] Job ${job.job_id} processed successfully`);
      }
    } catch (error) {
      console.error(`❌ [TRIGGER] Background processing error:`, error.message);
      // Don't fail the response - job will be retried later
    }

  } catch (error) {
    console.error('❌ [TRIGGER] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Manual trigger failed',
      error: error.message
    });
  }
});

// POST /api/jobs/worker - DISABLED TO STOP RESOURCE CONSUMPTION
router.post('/worker', async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Job processing temporarily disabled to conserve resources',
    disabled: true
  });
  
  // POST /api/jobs/worker - Process pending jobs (called by cron or manual trigger)
  /*
  try {
    console.log('🔄 [WORKER] Starting job processing...');

    // Get pending jobs
    const pendingJobsResult = await pool.query(`
      SELECT * FROM analysis_jobs 
      WHERE status IN ('pending', 'retrying')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      ORDER BY created_at ASC
      LIMIT 5
    `);

    const jobs = pendingJobsResult.rows;
    
    if (jobs.length === 0) {
      console.log('✅ [WORKER] No pending jobs found');
      return res.json({
        success: true,
        message: 'No pending jobs to process',
        processedJobs: 0
      });
    }

    console.log(`🚀 [WORKER] Processing ${jobs.length} jobs...`);
    
    const results = [];
    
    // Process each job
    for (const job of jobs) {
      try {
        await processJob(job);
        results.push({ jobId: job.job_id, status: 'success' });
      } catch (error) {
        console.error(`❌ [WORKER] Job ${job.job_id} failed:`, error.message);
        await handleJobError(job, error);
        results.push({ jobId: job.job_id, status: 'error', error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${jobs.length} jobs`,
      processedJobs: jobs.length,
      results
    });

  } catch (error) {
    console.error('❌ [WORKER] Critical error:', error);
    res.status(500).json({
      success: false,
      message: 'Worker failed',
      error: error.message
    });
  }
});

// Helper function to process a single job
async function processJob(job) {
  const { job_id, project_id, meta_targeting_spec, batch_size, current_batch } = job;
  
  console.log(`🔄 [WORKER] Processing job ${job_id} for project ${project_id}`);

  // Mark job as running
  await pool.query(`
    UPDATE analysis_jobs 
    SET status = 'running', started_at = NOW(), updated_at = NOW()
    WHERE job_id = $1
  `, [job_id]);

  // VERCEL OPTIMIZATION: Process only 1 postal code per function call to avoid timeout
  // Look in processing_results table (not postal_codes)
  // CORRECTION: Ne pas utiliser OFFSET car les éléments traités disparaissent de la condition WHERE
  const postalCodesResult = await pool.query(`
    SELECT postal_code FROM processing_results 
    WHERE project_id = $1 AND (
      (postal_code_only_estimate->>'audience_size') IS NULL OR
      (postal_code_with_targeting_estimate->>'audience_size') IS NULL OR
      (postal_code_only_estimate->>'audience_size')::int = 0 OR 
      (postal_code_with_targeting_estimate->>'audience_size')::int = 0
    )
    ORDER BY postal_code
    LIMIT 1
  `, [project_id]);

  const postalCodes = postalCodesResult.rows.map(row => row.postal_code);
  
  if (postalCodes.length === 0) {
    // Job completed - no more postal codes to process
    await pool.query(`
      UPDATE analysis_jobs 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE job_id = $1
    `, [job_id]);

    await pool.query(`
      UPDATE projects 
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1
    `, [project_id]);

    console.log(`✅ [WORKER] Job ${job_id} completed - no more postal codes`);
    return;
  }

  console.log(`🔄 [WORKER] Processing postal code ${current_batch + 1} (VERCEL micro-batch): ${postalCodes[0] || 'none'}`);

  // Process each postal code in this batch
  let processedInBatch = 0;
  let failedInBatch = 0;

  let metaApi;
  try {
    metaApi = require('../config/meta-api');
  } catch (error) {
    console.error(`❌ [WORKER] Meta API module not available:`, error.message);
    throw new Error('Meta API configuration not available');
  }
  
  for (const postalCode of postalCodes) {
    try {
      await processPostalCode(postalCode, project_id, meta_targeting_spec, metaApi);
      processedInBatch++;
      
      // Small delay between calls to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ [WORKER] Failed to process ${postalCode}:`, error.message);
      failedInBatch++;
    }
  }

  // Update job progress
  const totalProcessedResult = await pool.query(`
    SELECT COUNT(*) as count FROM processing_results 
    WHERE project_id = $1 AND success = true 
      AND (postal_code_only_estimate->>'audience_size')::int > 0 
      AND (postal_code_with_targeting_estimate->>'audience_size')::int > 0
  `, [project_id]);
  
  const totalProcessed = parseInt(totalProcessedResult.rows[0].count);
  
  await pool.query(`
    UPDATE analysis_jobs 
    SET 
      processed_items = $2,
      failed_items = failed_items + $3,
      current_batch = $4,
      updated_at = NOW()
    WHERE job_id = $1
  `, [job_id, totalProcessed, failedInBatch, current_batch + 1]);

  // Check if job is complete
  const remainingResult = await pool.query(`
    SELECT COUNT(*) as count FROM processing_results 
    WHERE project_id = $1 AND (
      (postal_code_only_estimate->>'audience_size') IS NULL OR
      (postal_code_with_targeting_estimate->>'audience_size') IS NULL OR
      (postal_code_only_estimate->>'audience_size')::int = 0 OR 
      (postal_code_with_targeting_estimate->>'audience_size')::int = 0
    )
  `, [project_id]);

  const remainingCount = parseInt(remainingResult.rows[0].count);
  
  if (remainingCount === 0) {
    // Job completed
    await pool.query(`
      UPDATE analysis_jobs 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE job_id = $1
    `, [job_id]);

    await pool.query(`
      UPDATE projects 
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1
    `, [project_id]);

    console.log(`✅ [WORKER] Job ${job_id} completed successfully`);
  } else {
    console.log(`🔄 [WORKER] Job ${job_id} batch completed, ${remainingCount} postal codes remaining`);
    
    // VERCEL OPTIMIZATION: Mark job as 'pending' for next worker cycle
    console.log(`🚀 [WORKER] Marking job ${job_id} as pending for next cycle...`);
    await pool.query(`
      UPDATE analysis_jobs 
      SET status = 'pending', updated_at = NOW()
      WHERE job_id = $1
    `, [job_id]);
  }
}

// Helper function to process a single postal code
async function processPostalCode(postalCode, projectId, targetingSpec, metaApi) {
  console.log(`🔄 [WORKER] Processing postal code ${postalCode}`);

  // Validation de l'API Meta
  if (!metaApi || !metaApi.api) {
    throw new Error('Meta API not properly initialized');
  }

  // 1. Get geographic audience
  const searchResponse = await metaApi.api.call('GET', ['search'], {
    type: 'adgeolocation',
    location_types: JSON.stringify(['zip']),
    q: postalCode,
    country_code: 'US',
    limit: 1,
    access_token: process.env.META_ACCESS_TOKEN
  });

  if (!searchResponse.data || searchResponse.data.length === 0) {
    throw new Error(`Postal code ${postalCode} not found`);
  }

  const zipCodeData = searchResponse.data[0];
  
  // Geographic targeting spec
  const geoTargetingSpec = {
    geo_locations: {
      zips: [{
        key: zipCodeData.key,
        name: zipCodeData.name,
        country_code: zipCodeData.country_code
      }]
    },
    age_min: 18,
    age_max: 65
  };

  // 2. Get audience estimate for geographic targeting
  const geoEstimate = await metaApi.api.call('GET', [getMetaAdAccountId(), 'delivery_estimate'], {
    targeting_spec: JSON.stringify(geoTargetingSpec),
    optimization_goal: 'REACH',
    access_token: process.env.META_ACCESS_TOKEN
  });

  const audienceGeo = geoEstimate.data?.[0]?.estimate_ready ? 
    (geoEstimate.data[0].estimate_mau_lower_bound || geoEstimate.data[0].users_lower_bound) : null;

  // 3. Get audience estimate for interest + geographic targeting  
  const convertedTargetingSpec = convertTargetingSpec(targetingSpec);
  const combinedTargetingSpec = {
    ...convertedTargetingSpec,
    geo_locations: geoTargetingSpec.geo_locations
  };

  const interestEstimate = await metaApi.api.call('GET', [getMetaAdAccountId(), 'delivery_estimate'], {
    targeting_spec: JSON.stringify(combinedTargetingSpec),
    optimization_goal: 'REACH',
    access_token: process.env.META_ACCESS_TOKEN
  });

  const audienceInterest = interestEstimate.data?.[0]?.estimate_ready ? 
    (interestEstimate.data[0].estimate_mau_lower_bound || interestEstimate.data[0].users_lower_bound) : null;

  // 4. Calculate ratio
  const ratio = (audienceGeo && audienceInterest) ? audienceInterest / audienceGeo : null;

  // 5. Update database (processing_results table)
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
      JSON.stringify({ audience_size: audienceInterest }),
      postalCode]);

  console.log(`✅ [WORKER] ${postalCode}: Geo=${audienceGeo}, Interest=${audienceInterest}, Ratio=${ratio}`);
}

// Helper function to handle job errors
async function handleJobError(job, error) {
  const { job_id, retry_count, max_retries } = job;
  
  if (retry_count < max_retries) {
    // Schedule retry with exponential backoff
    const retryDelay = Math.min(Math.pow(2, retry_count) * 60000, 3600000); // Max 1 hour
    const nextRetryAt = new Date(Date.now() + retryDelay);
    
    await pool.query(`
      UPDATE analysis_jobs 
      SET 
        status = 'retrying',
        retry_count = retry_count + 1,
        last_error = $2,
        next_retry_at = $3,
        updated_at = NOW()
      WHERE job_id = $1
    `, [job_id, error.message, nextRetryAt]);
    
    console.log(`🔄 [WORKER] Job ${job_id} scheduled for retry ${retry_count + 1}/${max_retries} at ${nextRetryAt}`);
  } else {
    // Max retries reached - mark as failed
    await pool.query(`
      UPDATE analysis_jobs 
      SET 
        status = 'failed',
        last_error = $2,
        completed_at = NOW(),
        updated_at = NOW()
      WHERE job_id = $1
    `, [job_id, error.message]);
    
    await pool.query(`
      UPDATE projects 
      SET status = 'error', updated_at = NOW()
      WHERE id = $1
    `, [job.project_id]);
    
    console.log(`❌ [WORKER] Job ${job_id} failed permanently after ${max_retries} retries`);
  }
}

// POST /api/jobs/test-trigger - Test trigger sans appels Meta API réels
router.post('/test-trigger', async (req, res) => {
  try {
    console.log('🧪 [TEST-TRIGGER] Testing job processing without Meta API calls...');

    // Get pending jobs
    const pendingJobsResult = await pool.query(`
      SELECT * FROM analysis_jobs 
      WHERE status IN ('pending', 'retrying')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      ORDER BY created_at ASC
      LIMIT 5
    `);

    const jobs = pendingJobsResult.rows;
    
    if (jobs.length === 0) {
      return res.json({
        success: true,
        message: 'No pending jobs to test',
        pendingJobs: 0,
        processed: 0
      });
    }

    console.log(`🧪 [TEST-TRIGGER] Found ${jobs.length} jobs for testing...`);
    
    const results = [];
    
    // Process each job (simulation only)
    for (const job of jobs) {
      try {
        // Simulate job processing without Meta API calls
        await pool.query(`
          UPDATE analysis_jobs 
          SET status = 'running', started_at = NOW(), updated_at = NOW()
          WHERE job_id = $1
        `, [job.job_id]);

        // Simulate completion
        await pool.query(`
          UPDATE analysis_jobs 
          SET status = 'completed', completed_at = NOW(), processed_items = total_items, updated_at = NOW()
          WHERE job_id = $1
        `, [job.job_id]);

        await pool.query(`
          UPDATE projects 
          SET status = 'completed', updated_at = NOW()
          WHERE id = $1
        `, [job.project_id]);

        results.push({ jobId: job.job_id, status: 'simulated_success' });
        console.log(`✅ [TEST-TRIGGER] Job ${job.job_id} simulated successfully`);
      } catch (error) {
        console.error(`❌ [TEST-TRIGGER] Job ${job.job_id} failed:`, error.message);
        results.push({ jobId: job.job_id, status: 'error', error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Test trigger completed. Simulated ${jobs.length} jobs.`,
      pendingJobs: jobs.length,
      processed: jobs.length,
      results,
      note: 'This was a simulation - no real Meta API calls were made'
    });

  } catch (error) {
    console.error('❌ [TEST-TRIGGER] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Test trigger failed',
      error: error.message
    });
  }
});

// POST /api/jobs/simple-process - Simple processing without pool issues
router.post('/simple-process/:projectId/:postalCode', async (req, res) => {
  let client = null;
  try {
    const { projectId, postalCode } = req.params;
    console.log(`🧪 [SIMPLE] Processing project ${projectId} postal code ${postalCode}...`);
    
    // Create single connection instead of using pool
    const { Client } = require('pg');
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    
    // Get project and targeting spec
    const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    const targeting_spec = typeof project.targeting_spec === 'string' ? 
      JSON.parse(project.targeting_spec) : project.targeting_spec;
    
    if (!targeting_spec) {
      return res.status(400).json({ success: false, message: 'No targeting spec found' });
    }
    
    // Process directly with Meta API
    const metaApi = require('../config/meta-api');
    
    // Step 1: Search postal code
    const searchResponse = await metaApi.api.call('GET', ['search'], {
      type: 'adgeolocation',
      location_types: JSON.stringify(['zip']),
      q: postalCode,
      country_code: 'US',
      limit: 1,
      access_token: process.env.META_ACCESS_TOKEN
    });

    if (!searchResponse.data || searchResponse.data.length === 0) {
      return res.json({
        success: false,
        message: `Postal code ${postalCode} not found`,
        searchResponse
      });
    }

    const zipCodeData = searchResponse.data[0];
    
    // Step 2: Geo estimate
    const geoTargetingSpec = {
      geo_locations: {
        zips: [{
          key: zipCodeData.key,
          name: zipCodeData.name,
          country_code: zipCodeData.country_code
        }]
      },
      age_min: 18,
      age_max: 65
    };

    const geoEstimate = await metaApi.api.call('GET', [getMetaAdAccountId(), 'delivery_estimate'], {
      targeting_spec: JSON.stringify(geoTargetingSpec),
      optimization_goal: 'REACH',
      access_token: process.env.META_ACCESS_TOKEN
    });

    const audienceGeo = geoEstimate.data?.[0]?.estimate_ready ? 
      (geoEstimate.data[0].estimate_mau_lower_bound || geoEstimate.data[0].users_lower_bound) : null;

    // Step 3: Interest estimate
    const convertedTargetingSpec = convertTargetingSpec(targeting_spec);
    const combinedTargetingSpec = {
      ...convertedTargetingSpec,
      geo_locations: geoTargetingSpec.geo_locations
    };

    const interestEstimate = await metaApi.api.call('GET', [getMetaAdAccountId(), 'delivery_estimate'], {
      targeting_spec: JSON.stringify(combinedTargetingSpec),
      optimization_goal: 'REACH',
      access_token: process.env.META_ACCESS_TOKEN
    });

    const audienceInterest = interestEstimate.data?.[0]?.estimate_ready ? 
      (interestEstimate.data[0].estimate_mau_lower_bound || interestEstimate.data[0].users_lower_bound) : null;

    // Step 4: Save to database with single connection
    await client.query(`
      UPDATE processing_results 
      SET 
        postal_code_only_estimate = $2,
        postal_code_with_targeting_estimate = $3,
        success = true,
        processed_at = NOW()
      WHERE project_id = $1 AND postal_code = $4
    `, [projectId, 
        JSON.stringify({ audience_size: audienceGeo }),
        JSON.stringify({ audience_size: audienceInterest }),
        postalCode]);
    
    res.json({
      success: true,
      message: `Simple processing completed for ${postalCode}`,
      results: {
        postalCode,
        projectId,
        audienceGeo,
        audienceInterest,
        savedValues: {
          postal_code_only_estimate: { audience_size: audienceGeo },
          postal_code_with_targeting_estimate: { audience_size: audienceInterest }
        }
      }
    });
    
  } catch (error) {
    console.error('🧪 [SIMPLE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Simple processing failed',
      error: error.message
    });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

// POST /api/jobs/debug-process - Debug processing with detailed logs
router.post('/debug-process/:projectId/:postalCode', async (req, res) => {
  try {
    const { projectId, postalCode } = req.params;
    console.log(`🧪 [DEBUG] Direct processing for project ${projectId} postal code ${postalCode}...`);
    
    // Get project and targeting spec
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    const targeting_spec = typeof project.targeting_spec === 'string' ? 
      JSON.parse(project.targeting_spec) : project.targeting_spec;
    
    if (!targeting_spec) {
      return res.status(400).json({ success: false, message: 'No targeting spec found' });
    }
    
    // Process directly with Meta API and return debug info
    const metaApi = require('../config/meta-api');
    
    // Step 1: Search postal code
    const searchResponse = await metaApi.api.call('GET', ['search'], {
      type: 'adgeolocation',
      location_types: JSON.stringify(['zip']),
      q: postalCode,
      country_code: 'US',
      limit: 1,
      access_token: process.env.META_ACCESS_TOKEN
    });

    if (!searchResponse.data || searchResponse.data.length === 0) {
      return res.json({
        success: false,
        message: `Postal code ${postalCode} not found`,
        searchResponse
      });
    }

    const zipCodeData = searchResponse.data[0];
    
    // Step 2: Geo estimate
    const geoTargetingSpec = {
      geo_locations: {
        zips: [{
          key: zipCodeData.key,
          name: zipCodeData.name,
          country_code: zipCodeData.country_code
        }]
      },
      age_min: 18,
      age_max: 65
    };

    const geoEstimate = await metaApi.api.call('GET', [getMetaAdAccountId(), 'delivery_estimate'], {
      targeting_spec: JSON.stringify(geoTargetingSpec),
      optimization_goal: 'REACH',
      access_token: process.env.META_ACCESS_TOKEN
    });

    const audienceGeo = geoEstimate.data?.[0]?.estimate_ready ? 
      (geoEstimate.data[0].estimate_mau_lower_bound || geoEstimate.data[0].users_lower_bound) : null;

    // Step 3: Interest estimate
    const convertedTargetingSpec = convertTargetingSpec(targeting_spec);
    const combinedTargetingSpec = {
      ...convertedTargetingSpec,
      geo_locations: geoTargetingSpec.geo_locations
    };

    const interestEstimate = await metaApi.api.call('GET', [getMetaAdAccountId(), 'delivery_estimate'], {
      targeting_spec: JSON.stringify(combinedTargetingSpec),
      optimization_goal: 'REACH',
      access_token: process.env.META_ACCESS_TOKEN
    });

    const audienceInterest = interestEstimate.data?.[0]?.estimate_ready ? 
      (interestEstimate.data[0].estimate_mau_lower_bound || interestEstimate.data[0].users_lower_bound) : null;

    // Step 4: Save to database
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
        JSON.stringify({ audience_size: audienceInterest }),
        postalCode]);
    
    res.json({
      success: true,
      message: `Debug processing completed for ${postalCode}`,
      debug: {
        postalCode,
        projectId,
        zipCodeData,
        originalTargetingSpec: targeting_spec,
        convertedTargetingSpec,
        geoTargetingSpec,
        combinedTargetingSpec,
        geoEstimate,
        interestEstimate,
        audienceGeo,
        audienceInterest,
        savedValues: {
          postal_code_only_estimate: { audience_size: audienceGeo },
          postal_code_with_targeting_estimate: { audience_size: audienceInterest }
        }
      }
    });
    
  } catch (error) {
    console.error('🧪 [DEBUG] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug processing failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// POST /api/jobs/emergency-process - Emergency direct processing (fallback)
router.post('/emergency-process/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`🚨 [EMERGENCY] Direct processing for project ${projectId}...`);
    
    // Get project and postal codes
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    const targeting_spec = typeof project.targeting_spec === 'string' ? 
      JSON.parse(project.targeting_spec) : project.targeting_spec;
    
    if (!targeting_spec) {
      return res.status(400).json({ success: false, message: 'No targeting spec found' });
    }
    
    // Get 1 unprocessed postal code
    const postalResult = await pool.query(`
      SELECT postal_code FROM processing_results 
      WHERE project_id = $1 AND (
        (postal_code_only_estimate->>'audience_size') IS NULL OR
        (postal_code_with_targeting_estimate->>'audience_size') IS NULL OR
        (postal_code_only_estimate->>'audience_size')::int = 0 OR 
        (postal_code_with_targeting_estimate->>'audience_size')::int = 0
      )
      LIMIT 1
    `, [projectId]);
    
    if (postalResult.rows.length === 0) {
      return res.json({ success: true, message: 'All postal codes already processed' });
    }
    
    const postalCode = postalResult.rows[0].postal_code;
    
    // Process directly with Meta API
    await processPostalCode(postalCode, projectId, targeting_spec, require('../config/meta-api'));
    
    res.json({
      success: true,
      message: `Emergency processing completed for ${postalCode}`,
      postalCode,
      projectId
    });
    
  } catch (error) {
    console.error('🚨 [EMERGENCY] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Emergency processing failed',
      error: error.message
    });
  }
});

// GET /api/jobs/health - Health check for job system
router.get('/health', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM analysis_jobs 
      GROUP BY status
    `);
    
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      jobs: stats.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      totalJobs: stats.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
    };
    
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/jobs/reset-stuck - Reset jobs bloqués depuis plus de 10 minutes
router.post('/reset-stuck', async (req, res) => {
  try {
    console.log('🔧 [RESET-STUCK] Resetting stuck jobs...');
    
    // Reset jobs "running" depuis plus de 10 minutes
    const resetResult = await pool.query(`
      UPDATE analysis_jobs 
      SET status = 'pending', updated_at = NOW()
      WHERE status = 'running' 
        AND started_at < NOW() - INTERVAL '10 minutes'
    `);
    
    console.log(`🔧 [RESET-STUCK] Reset ${resetResult.rowCount} stuck jobs`);
    
    res.json({
      success: true,
      message: `Reset ${resetResult.rowCount} stuck jobs`,
      resetCount: resetResult.rowCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [RESET-STUCK] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset stuck jobs',
      error: error.message
    });
  }
});

// Export des fonctions pour utilisation interne
module.exports = router;
module.exports.processJob = processJob;
module.exports.processPostalCode = processPostalCode;