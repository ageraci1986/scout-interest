-- Script pour créer un job de test et quelques codes postaux
-- À exécuter manuellement dans la base de données pour tester le système

-- 1. Créer un projet de test
INSERT INTO projects (id, name, description, status, total_postal_codes, processed_postal_codes) 
VALUES (999, 'Test Job System', 'Projet de test pour le système de jobs', 'processing', 2, 0);

-- 2. Créer quelques codes postaux pour ce projet
INSERT INTO postal_codes (project_id, postal_code, country, status) 
VALUES 
  (999, '10001', 'US', 'pending'),
  (999, '90210', 'US', 'pending');

-- 3. Créer un job de test
INSERT INTO analysis_jobs (
  project_id, 
  job_id, 
  status, 
  total_items, 
  processed_items, 
  failed_items,
  meta_targeting_spec,
  batch_size,
  current_batch,
  retry_count,
  max_retries
) VALUES (
  999,
  'test-job-' || generate_random_uuid(),
  'pending',
  2,
  0,
  0,
  '{"age_min": 18, "age_max": 65, "genders": [1, 2], "interests": [{"id": "6003107902433", "name": "Technology"}]}',
  200,
  0,
  0,
  3
);