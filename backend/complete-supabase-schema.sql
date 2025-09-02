-- Schéma complet pour Scout Interest sur Supabase
-- À exécuter dans l'interface SQL de Supabase

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
    description TEXT,
    user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    total_postal_codes INTEGER DEFAULT 0,
    processed_postal_codes INTEGER DEFAULT 0,
    error_postal_codes INTEGER DEFAULT 0,
    targeting_spec JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des uploads de fichiers
CREATE TABLE IF NOT EXISTS file_uploads (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    upload_path TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    validation_errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résultats de traitement
CREATE TABLE IF NOT EXISTS processing_results (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    zip_data JSONB,
    postal_code_only_estimate JSONB,
    postal_code_with_targeting_estimate JSONB,
    targeting_spec JSONB,
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des codes postaux
CREATE TABLE IF NOT EXISTS postal_codes (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(10) DEFAULT 'FR',
    region VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    audience_interest INTEGER,
    audience_geo INTEGER,
    ratio DECIMAL(5,4),
    meta_interest_id VARCHAR(255),
    meta_interest_name VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des jobs d'analyse
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    meta_targeting_spec JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs API
CREATE TABLE IF NOT EXISTS api_logs (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time INTEGER,
    error_message TEXT,
    meta_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_targeting_spec ON projects USING GIN (targeting_spec);

CREATE INDEX IF NOT EXISTS idx_file_uploads_project_id ON file_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status);

CREATE INDEX IF NOT EXISTS idx_processing_results_project_id ON processing_results(project_id);
CREATE INDEX IF NOT EXISTS idx_processing_results_postal_code ON processing_results(postal_code);
CREATE INDEX IF NOT EXISTS idx_processing_results_success ON processing_results(success);

CREATE INDEX IF NOT EXISTS idx_postal_codes_project_id ON postal_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_postal_codes_status ON postal_codes(status);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project_id ON analysis_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);

CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_uploads_updated_at 
    BEFORE UPDATE ON file_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_postal_codes_updated_at 
    BEFORE UPDATE ON postal_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_jobs_updated_at 
    BEFORE UPDATE ON analysis_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS (Row Level Security) pour Supabase
-- Activer RLS sur les tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour les projets
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Politique pour les uploads de fichiers
CREATE POLICY "Users can view uploads of their projects" ON file_uploads
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can insert uploads for their projects" ON file_uploads
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can update uploads of their projects" ON file_uploads
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can delete uploads of their projects" ON file_uploads
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

-- Politique pour les résultats de traitement
CREATE POLICY "Users can view results of their projects" ON processing_results
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can insert results for their projects" ON processing_results
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can update results of their projects" ON processing_results
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can delete results of their projects" ON processing_results
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

-- Politique pour les codes postaux
CREATE POLICY "Users can view postal codes of their projects" ON postal_codes
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can insert postal codes for their projects" ON postal_codes
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can update postal codes of their projects" ON postal_codes
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can delete postal codes of their projects" ON postal_codes
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

-- Politique pour les jobs d'analyse
CREATE POLICY "Users can view analysis jobs of their projects" ON analysis_jobs
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can insert analysis jobs for their projects" ON analysis_jobs
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can update analysis jobs of their projects" ON analysis_jobs
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can delete analysis jobs of their projects" ON analysis_jobs
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        )
    );

-- Politique pour les logs API
CREATE POLICY "Users can view api logs of their projects" ON api_logs
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        ) OR project_id IS NULL
    );

CREATE POLICY "Users can insert api logs for their projects" ON api_logs
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid()::text OR user_id = 'anonymous'
        ) OR project_id IS NULL
    );

-- Fonction pour obtenir les statistiques d'un projet
CREATE OR REPLACE FUNCTION get_project_stats(project_id_param BIGINT)
RETURNS TABLE(
    total_codes INTEGER,
    successful_codes INTEGER,
    error_codes INTEGER,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_codes,
        COUNT(*) FILTER (WHERE success = true)::INTEGER as successful_codes,
        COUNT(*) FILTER (WHERE success = false)::INTEGER as error_codes,
        ROUND(
            (COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
            2
        ) as success_rate
    FROM processing_results 
    WHERE project_id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Insérer un projet de test (optionnel)
INSERT INTO projects (name, description, user_id, total_postal_codes) 
VALUES ('Sample Project', 'Sample project for testing', 'anonymous', 10)
ON CONFLICT DO NOTHING;
