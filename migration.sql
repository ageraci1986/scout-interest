-- Migration Script pour Scout Interest
-- À exécuter dans l'interface SQL de Supabase

-- 1. Ajouter les colonnes manquantes à la table projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS targeting_spec JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- 2. Créer la table analysis_jobs
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  job_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  current_batch INTEGER DEFAULT 0,
  batch_size INTEGER DEFAULT 200,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  meta_targeting_spec JSONB,
  last_error TEXT,
  next_retry_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- 3. Créer les indexes
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project_id ON analysis_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_job_id ON analysis_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);

-- 4. Vérifier la structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('projects', 'analysis_jobs', 'processing_results')
ORDER BY table_name, ordinal_position;