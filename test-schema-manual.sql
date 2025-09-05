-- Instructions pour appliquer manuellement le schéma simple
-- 
-- Étapes :
-- 1. Aller sur https://supabase.com/dashboard
-- 2. Ouvrir votre projet Scout Interest
-- 3. Aller dans SQL Editor
-- 4. Copier-coller ce script et l'exécuter

-- ============================================
-- ÉTAPE 1: Sauvegarde des données existantes
-- ============================================

-- Optionnel: Sauvegarder les projets existants
CREATE TABLE IF NOT EXISTS projects_backup AS 
SELECT * FROM projects;

CREATE TABLE IF NOT EXISTS processing_results_backup AS 
SELECT * FROM processing_results;

-- ============================================
-- ÉTAPE 2: Supprimer les anciennes tables
-- ============================================

DROP TABLE IF EXISTS processing_results CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================
-- ÉTAPE 3: Créer le nouveau schéma simplifié
-- ============================================

-- Table projects simplifiée
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
    postal_codes TEXT[] NOT NULL DEFAULT '{}', -- Array des codes postaux
    targeting_spec JSONB, -- Spec de targeting Meta
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table results ultra-simple
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

-- Index essentiels
CREATE INDEX idx_results_project_id ON results(project_id);
CREATE INDEX idx_results_postal_code ON results(postal_code);
CREATE INDEX idx_results_status ON results(status);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour projects
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÉTAPE 4: Configuration RLS (Row Level Security)
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Politique simple : tout le monde peut tout faire (MVP)
CREATE POLICY "Enable all operations for everyone" ON projects FOR ALL USING (true);
CREATE POLICY "Enable all operations for everyone" ON results FOR ALL USING (true);

-- ============================================
-- ÉTAPE 5: Fonction helper
-- ============================================

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

-- ============================================
-- ÉTAPE 6: Test du nouveau schéma
-- ============================================

-- Insérer un project de test
INSERT INTO projects (name, postal_codes) 
VALUES ('Test Project', ARRAY['10001', '10002', '10003']);

-- Vérifier que ça marche
SELECT * FROM projects;

-- Supprimer le projet de test
DELETE FROM projects WHERE name = 'Test Project';

-- ============================================
-- TERMINÉ ! 🎉
-- ============================================
-- 
-- Le nouveau schéma est maintenant en place.
-- Vous pouvez maintenant déployer le nouveau code backend.