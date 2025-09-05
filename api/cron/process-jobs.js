// Vercel Cron Job endpoint for processing Meta API jobs (BACKUP ONLY)
// 
// ⚠️  PRIMARY PROCESSING: Jobs are processed IMMEDIATELY after targeting validation
// 🛡️  BACKUP PURPOSE: This cron catches any jobs that failed to start immediately
// 
// Configure in vercel.json with:
// {
//   "crons": [
//     {
//       "path": "/api/cron/process-jobs",  
//       "schedule": "0 9 * * *"  // Daily at 9 AM UTC (backup cleanup)
//     }
//   ]
// }

const { Pool } = require('pg');
const fetch = require('node-fetch');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // Only allow POST requests (for Vercel Cron)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify the request is from Vercel Cron (optional but recommended)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🕒 [CRON] Starting scheduled job processing...');

    // Check if there are any pending jobs
    const pendingJobsResult = await pool.query(`
      SELECT COUNT(*) as count FROM analysis_jobs 
      WHERE status IN ('pending', 'retrying')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    `);

    const pendingCount = parseInt(pendingJobsResult.rows[0].count);
    
    if (pendingCount === 0) {
      console.log('✅ [CRON] No pending jobs found');
      return res.json({
        success: true,
        message: 'No pending jobs to process',
        pendingJobs: 0,
        processed: 0
      });
    }

    console.log(`🚀 [CRON] Found ${pendingCount} pending jobs, triggering worker...`);

    // Call the worker endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3001}`;

    const workerResponse = await fetch(`${baseUrl}/api/jobs/worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Cron'
      },
      timeout: 300000 // 5 minutes timeout for worker
    });

    if (!workerResponse.ok) {
      throw new Error(`Worker failed with status ${workerResponse.status}`);
    }

    const workerResult = await workerResponse.json();
    
    console.log(`✅ [CRON] Worker completed successfully:`, workerResult);

    res.json({
      success: true,
      message: `Cron job completed successfully`,
      pendingJobs: pendingCount,
      processed: workerResult.processedJobs || 0,
      results: workerResult.results || []
    });

  } catch (error) {
    console.error('❌ [CRON] Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Cron job failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}