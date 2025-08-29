-- Script de création des tables pour Supabase
-- À exécuter dans l'interface SQL de Supabase

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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_processing_results_project_id ON processing_results(project_id);
CREATE INDEX IF NOT EXISTS idx_processing_results_postal_code ON processing_results(postal_code);
CREATE INDEX IF NOT EXISTS idx_processing_results_success ON processing_results(success);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at sur projects
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS (Row Level Security) pour Supabase
-- Activer RLS sur les tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_results ENABLE ROW LEVEL SECURITY;

-- Politique pour les projets (chaque utilisateur voit ses propres projets)
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = 'anonymous');

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

