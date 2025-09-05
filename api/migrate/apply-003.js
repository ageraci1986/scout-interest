// Endpoint temporaire pour appliquer la migration 003 en production
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // Only allow POST requests and verify it's an admin request
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔄 [MIGRATION] Starting migration 003...');

    // Migration 003 SQL
    const migration003SQL = `
      -- Add fields for Job async pattern
      ALTER TABLE analysis_jobs 
      ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
      ADD COLUMN IF NOT EXISTS last_error TEXT,
      ADD COLUMN IF NOT EXISTS batch_size INTEGER DEFAULT 200,
      ADD COLUMN IF NOT EXISTS current_batch INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;

      -- Add index for worker queries
      CREATE INDEX IF NOT EXISTS idx_analysis_jobs_worker ON analysis_jobs(status, next_retry_at, created_at);

      -- Add job states enum check
      ALTER TABLE analysis_jobs 
      DROP CONSTRAINT IF EXISTS analysis_jobs_status_check;

      ALTER TABLE analysis_jobs 
      ADD CONSTRAINT analysis_jobs_status_check 
      CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retrying'));
    `;

    // Execute migration
    await pool.query(migration003SQL);

    console.log('✅ [MIGRATION] Migration 003 applied successfully');

    res.json({
      success: true,
      message: 'Migration 003 applied successfully',
      timestamp: new Date().toISOString(),
      changes: [
        'Added retry_count, max_retries, last_error columns',
        'Added batch_size, current_batch columns',
        'Added started_at, completed_at, next_retry_at timestamps',
        'Added worker index idx_analysis_jobs_worker',
        'Updated status constraint for new states'
      ]
    });

  } catch (error) {
    console.error('❌ [MIGRATION] Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}