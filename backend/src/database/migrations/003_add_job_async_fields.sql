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