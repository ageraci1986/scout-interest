-- SCHÉMA ULTRA-SIMPLIFIÉ POUR SCOUT INTEREST
-- Supprime l'ancien et crée le nouveau schéma minimal

-- 1. Supprimer les anciennes tables
DROP TABLE IF EXISTS processing_results CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 2. Table projects simplifiée
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
    postal_codes TEXT[] NOT NULL DEFAULT '{}', -- Array des codes postaux
    targeting_spec JSONB, -- Spec de targeting Meta
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table results ultra-simple
CREATE TABLE results (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    postal_code VARCHAR(20) NOT NULL,
    geo_audience BIGINT, -- Audience géographique (sans targeting)
    targeting_audience BIGINT, -- Audience avec targeting
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, error
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Index essentiels seulement
CREATE INDEX idx_results_project_id ON results(project_id);
CREATE INDEX idx_results_postal_code ON results(postal_code);
CREATE INDEX idx_results_status ON results(status);

-- 5. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger pour projects
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS basique (pour Supabase)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Politique simple : tout le monde peut tout faire (MVP)
CREATE POLICY "Enable all operations for everyone" ON projects FOR ALL USING (true);
CREATE POLICY "Enable all operations for everyone" ON results FOR ALL USING (true);

-- 8. Fonction helper pour obtenir les stats d'un projet
CREATE OR REPLACE FUNCTION get_project_with_results(project_id_param BIGINT)
RETURNS TABLE(
    id BIGINT,
    name VARCHAR(255),
    postal_codes TEXT[],
    targeting_spec JSONB,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    results JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.postal_codes,
        p.targeting_spec,
        p.status,
        p.created_at,
        p.updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'postal_code', r.postal_code,
                    'geo_audience', r.geo_audience,
                    'targeting_audience', r.targeting_audience,
                    'status', r.status,
                    'error_message', r.error_message,
                    'processed_at', r.processed_at
                )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'::jsonb
        ) as results
    FROM projects p
    LEFT JOIN results r ON p.id = r.project_id
    WHERE p.id = project_id_param
    GROUP BY p.id, p.name, p.postal_codes, p.targeting_spec, p.status, p.created_at, p.updated_at;
END;
$$ LANGUAGE plpgsql;