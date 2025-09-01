# 🗄️ Configuration Supabase pour Scout Interest

## 📋 Prérequis

1. **Compte Supabase** : https://supabase.com
2. **GitHub** : Votre code doit être sur GitHub

## 🔧 Étape 1 : Créer un projet Supabase

### 1.1 Créer le projet
1. Allez sur https://supabase.com
2. Cliquez "Start your project"
3. Connectez-vous avec GitHub
4. Cliquez "New Project"
5. Configurez :
   - **Organization** : Votre organisation
   - **Name** : `scout-interest-db`
   - **Database Password** : Créez un mot de passe fort
   - **Region** : Choisissez la région la plus proche (Europe pour vous)
6. Cliquez "Create new project"

### 1.2 Attendre l'initialisation
- Le projet prend 2-3 minutes à s'initialiser
- Vous recevrez un email de confirmation

## 🔧 Étape 2 : Récupérer les informations de connexion

### 2.1 Dans votre projet Supabase
1. Allez dans **Settings** > **Database**
2. Copiez les informations suivantes :
   - **Host** : `db.xxxxxxxxxxxxx.supabase.co`
   - **Database name** : `postgres`
   - **Port** : `5432`
   - **User** : `postgres`
   - **Password** : Votre mot de passe

### 2.2 URL de connexion
L'URL de connexion sera au format :
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

## 🔧 Étape 3 : Créer les tables dans Supabase

### 3.1 Accéder à l'éditeur SQL
1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez "New query"

### 3.2 Exécuter le script de création des tables
Copiez et exécutez ce script SQL :

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(255) DEFAULT 'anonymous',
    status VARCHAR(50) DEFAULT 'active',
    total_postal_codes INTEGER DEFAULT 0,
    processed_postal_codes INTEGER DEFAULT 0,
    error_postal_codes INTEGER DEFAULT 0,
    targeting_spec JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create processing_results table
CREATE TABLE IF NOT EXISTS processing_results (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(10) DEFAULT 'US',
    zip_data JSONB,
    postal_code_only_estimate JSONB,
    postal_code_with_targeting_estimate JSONB,
    targeting_spec JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_processing_results_project_id ON processing_results(project_id);
CREATE INDEX IF NOT EXISTS idx_processing_results_postal_code ON processing_results(postal_code);
CREATE INDEX IF NOT EXISTS idx_projects_targeting_spec ON projects USING GIN (targeting_spec);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects table
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO projects (name, description, user_id, total_postal_codes) 
VALUES ('Sample Project', 'Sample project for testing', 'anonymous', 10)
ON CONFLICT DO NOTHING;
```

## 🔧 Étape 4 : Configurer les variables d'environnement

### 4.1 Variables pour Vercel
Dans votre projet Vercel, ajoutez ces variables d'environnement :

```
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# Meta API Configuration
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_access_token
META_AD_ACCOUNT_ID=your_ad_account_id

# CORS Configuration
CORS_ORIGIN=https://your-project.vercel.app

# Environment
NODE_ENV=production
```

### 4.2 Remplacer les valeurs
- Remplacez `[YOUR-PASSWORD]` par votre mot de passe Supabase
- Remplacez `db.xxxxxxxxxxxxx.supabase.co` par votre host Supabase
- Remplacez les valeurs Meta API par vos vraies valeurs

## 🔧 Étape 5 : Tester la connexion

### 5.1 Test local (optionnel)
Si vous voulez tester localement :

```bash
# Dans le dossier backend
cd backend

# Créer un fichier .env avec les variables Supabase
echo "DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres" > .env

# Tester la connexion
npm run test-db
```

## 🔧 Étape 6 : Déployer sur Vercel

### 6.1 Configuration Vercel
1. Allez sur https://vercel.com
2. Importez votre repo GitHub
3. Configurez :
   - **Framework Preset** : Other
   - **Root Directory** : `/`
   - **Build Command** : `cd frontend && npm run build`
   - **Output Directory** : `frontend/build`

### 6.2 Variables d'environnement Vercel
Ajoutez toutes les variables d'environnement listées ci-dessus.

## 🐛 Dépannage

### Problème de connexion à la base de données
- Vérifiez que l'URL DATABASE_URL est correcte
- Vérifiez que le mot de passe est correct
- Vérifiez que l'IP n'est pas bloquée (Supabase autorise toutes les IPs par défaut)

### Problème de CORS
- Vérifiez que CORS_ORIGIN pointe vers votre URL Vercel
- Redémarrez l'application après modification

### Problème de tables
- Vérifiez que le script SQL a été exécuté correctement
- Vérifiez les logs dans Supabase

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans Vercel
2. Vérifiez les logs dans Supabase
3. Testez la connexion à la base de données
4. Vérifiez les variables d'environnement
