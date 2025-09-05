-- EMERGENCY DATABASE CLEANUP
-- Supprimer TOUS les projets et données pour arrêter les appels polling

-- 1. Supprimer tous les jobs d'analyse
DELETE FROM analysis_jobs;

-- 2. Supprimer tous les résultats de processing
DELETE FROM processing_results;

-- 3. Supprimer tous les projets
DELETE FROM projects;

-- 4. Vérifier que tout est vide
SELECT 'analysis_jobs' as table_name, COUNT(*) as count FROM analysis_jobs
UNION ALL
SELECT 'processing_results' as table_name, COUNT(*) as count FROM processing_results  
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as count FROM projects;

-- 5. Reset des séquences (optionnel)
SELECT setval('projects_id_seq', 1, false);
SELECT setval('processing_results_id_seq', 1, false);
SELECT setval('analysis_jobs_id_seq', 1, false);