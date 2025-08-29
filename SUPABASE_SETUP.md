# 🗄️ Configuration Supabase pour Scout Interest

## 🎯 Problème Actuel

Actuellement, l'application utilise une **base de données mock en mémoire** qui est réinitialisée à chaque redémarrage du backend. Cela explique pourquoi vous voyez "0% de succès" et "Aucun résultat" dans l'interface.

## ✅ Solution : Configuration Supabase

### 1. Créer un compte Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte gratuit
3. Créez un nouveau projet

### 2. Récupérer les clés d'API

1. Dans votre projet Supabase, allez dans **Settings** → **API**
2. Copiez :
   - **Project URL** (ex: `https://your-project.supabase.co`)
   - **anon public** key (commence par `eyJ...`)

### 3. Configurer les variables d'environnement

Dans le dossier `backend`, créez ou modifiez le fichier `.env` :

```bash
# Meta API Configuration
META_ACCESS_TOKEN=your_meta_access_token
META_AD_ACCOUNT_ID=act_your_ad_account_id

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Créer les tables dans Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Exécutez le script SQL suivant :

```sql
-- Créer la table des projets
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    total_postal_codes INTEGER DEFAULT 0,
    processed_postal_codes INTEGER DEFAULT 0,
    error_postal_codes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table des résultats de traitement
CREATE TABLE processing_results (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    zip_data JSONB,
    postal_code_only_estimate JSONB,
    postal_code_with_targeting_estimate JSONB,
    targeting_spec JSONB,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour les performances
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_processing_results_project_id ON processing_results(project_id);
CREATE INDEX idx_processing_results_postal_code ON processing_results(postal_code);

-- Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Activer Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_results ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (user_id = 'anonymous');

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (user_id = 'anonymous');

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (user_id = 'anonymous');

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (user_id = 'anonymous');

CREATE POLICY "Users can view results of their projects" ON processing_results
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = 'anonymous'
        )
    );

CREATE POLICY "Users can insert results for their projects" ON processing_results
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = 'anonymous'
        )
    );

-- Fonction pour obtenir les statistiques d'un projet
CREATE OR REPLACE FUNCTION get_project_stats(project_id_param BIGINT)
RETURNS TABLE(
    total_postal_codes BIGINT,
    processed_postal_codes BIGINT,
    error_postal_codes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_postal_codes,
        COUNT(*) FILTER (WHERE success = true)::BIGINT as processed_postal_codes,
        COUNT(*) FILTER (WHERE success = false)::BIGINT as error_postal_codes
    FROM processing_results 
    WHERE project_id = project_id_param;
END;
$$ LANGUAGE plpgsql;
```

### 5. Redémarrer le backend

```bash
cd backend
pkill -f "node src/server.js"
node src/server.js
```

### 6. Vérifier la configuration

Vous devriez voir dans les logs :
```
✅ Supabase client initialized
```

Au lieu de :
```
⚠️  Supabase configuration missing. Using mock database.
```

## 🧪 Test de la configuration

### 1. Créer un projet
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Supabase","description":"Test de la persistance","userId":"anonymous"}'
```

### 2. Vérifier que le projet est créé
```bash
curl -X GET http://localhost:3001/api/projects/user/anonymous
```

### 3. Lancer un traitement
```bash
curl -X POST http://localhost:3001/api/meta/batch-postal-codes-reach-estimate-v2 \
  -H "Content-Type: application/json" \
  -d '{"adAccountId":"act_811288492239748","postalCodes":["75001","75002"],"countryCode":"FR","targetingSpec":{},"projectId":PROJECT_ID}'
```

### 4. Vérifier les résultats
```bash
curl -X GET http://localhost:3001/api/projects/PROJECT_ID/results
```

## 🔍 Vérification dans Supabase

1. Allez dans **Table Editor** dans votre projet Supabase
2. Vérifiez que les tables `projects` et `processing_results` sont créées
3. Vérifiez que les données sont bien insérées

## 🚨 Dépannage

### Problème : "Supabase configuration missing"
**Solution** : Vérifiez que les variables `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont bien définies dans le fichier `.env`

### Problème : "relation does not exist"
**Solution** : Exécutez le script SQL pour créer les tables

### Problème : "permission denied"
**Solution** : Vérifiez que les politiques RLS sont bien créées

### Problème : "invalid API key"
**Solution** : Vérifiez que la clé anon est correcte dans les paramètres Supabase

## 🎯 Résultat attendu

Après la configuration :
- ✅ Les projets sont persistants même après redémarrage
- ✅ Les résultats de traitement sont sauvegardés
- ✅ L'interface affiche les bonnes statistiques
- ✅ Plus de "0% de succès" ou "Aucun résultat"

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du backend
2. Vérifiez la console du navigateur
3. Vérifiez les tables dans Supabase
4. Contactez-moi avec les erreurs spécifiques
