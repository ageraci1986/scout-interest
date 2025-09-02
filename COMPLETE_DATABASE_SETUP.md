# Guide Complet de Configuration de la Base de Données

## 📋 Tables Nécessaires pour Scout Interest

L'application Scout Interest nécessite les tables suivantes pour fonctionner correctement :

### ✅ Tables Principales
1. **`projects`** - Gestion des projets utilisateur
2. **`file_uploads`** - Gestion des uploads de fichiers Excel/CSV
3. **`processing_results`** - Résultats du traitement des codes postaux
4. **`postal_codes`** - Codes postaux traités
5. **`analysis_jobs`** - Jobs d'analyse en arrière-plan
6. **`api_logs`** - Logs des appels API

## 🔧 Vérification et Création des Tables

### Option 1 : Script Automatique (Recommandé)

Exécutez le script de vérification automatique :

```bash
cd backend
DATABASE_URL="postgresql://postgres.wnugqzgzzwmebjjsfrns:VOTRE_MOT_DE_PASSE@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" node verify-all-tables.js
```

Ce script va :
- ✅ Vérifier quelles tables existent déjà
- ✅ Créer les tables manquantes
- ✅ Créer tous les index nécessaires
- ✅ Créer les fonctions et triggers
- ✅ Configurer les politiques RLS
- ✅ Fournir un rapport complet

### Option 2 : Schéma SQL Complet

Si vous préférez exécuter le SQL manuellement dans l'interface Supabase :

1. Allez dans votre projet Supabase
2. Ouvrez l'éditeur SQL
3. Copiez et exécutez le contenu de `backend/complete-supabase-schema.sql`

## 📊 Résultat Attendu

Après exécution, vous devriez voir :

```
🔍 Vérification complète des tables Supabase...
🔌 Connecting to Supabase...
✅ Connected to Supabase
📋 Checking and creating tables...
✅ Table 'projects' already exists
✅ Table 'file_uploads' already exists
✅ Table 'processing_results' already exists
✅ Table 'postal_codes' already exists
✅ Table 'analysis_jobs' already exists
✅ Table 'api_logs' already exists

📋 Creating indexes...
✅ Index created: idx_projects_user_id
✅ Index created: idx_projects_status
...

📋 Creating functions and triggers...
✅ Function update_updated_at_column created
✅ Trigger created: update_projects_updated_at
...

🔍 Final verification...
📋 All tables found: ['projects', 'file_uploads', 'processing_results', 'postal_codes', 'analysis_jobs', 'api_logs']

📊 Summary:
- Created tables: 0 ()
- Existing tables: 6 (projects, file_uploads, processing_results, postal_codes, analysis_jobs, api_logs)
- Total tables: 6/6
🎉 All required tables are present!
✅ Database verification completed!
```

## 🔍 Vérification Manuelle

Vous pouvez aussi vérifier manuellement dans l'interface Supabase :

1. **Table Editor** > Vérifiez que toutes les tables sont présentes
2. **SQL Editor** > Exécutez :
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name IN ('projects', 'file_uploads', 'processing_results', 'postal_codes', 'analysis_jobs', 'api_logs')
   ORDER BY table_name;
   ```

## 🚨 Problèmes Courants

### Erreur "relation does not exist"
- Exécutez le script `verify-all-tables.js`
- Vérifiez que la `DATABASE_URL` est correcte

### Erreur de permissions RLS
- Les politiques RLS sont automatiquement créées par le script
- Vérifiez que l'utilisateur a les bonnes permissions

### Tables manquantes
- Le script détecte et crée automatiquement les tables manquantes
- Vérifiez les logs pour identifier les erreurs

## 🔄 Après la Configuration

Une fois toutes les tables créées :

1. **Testez l'upload** d'un fichier Excel/CSV
2. **Vérifiez les projets** se chargent correctement
3. **Redéployez sur Vercel** si nécessaire :
   ```bash
   ./deploy.sh vercel
   ```

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs du script `verify-all-tables.js`
2. Consultez les erreurs dans l'interface Supabase
3. Vérifiez que la `DATABASE_URL` utilise la nouvelle URL pooler

---

**Note** : Ce script est idempotent - il peut être exécuté plusieurs fois sans problème. Il ne recréera pas les tables existantes.
