# 🚀 Guide de Déploiement Vercel - Étape par Étape

## 📋 Prérequis
- ✅ Code poussé sur GitHub
- ✅ Projet Supabase configuré
- ✅ Connexion Supabase testée

## 🔧 Étape 1 : Configuration des Variables d'Environnement

### 1.1 Variables d'environnement REQUISES
Avant le déploiement, vous devez configurer ces variables dans Vercel :

**Variables Supabase (OBLIGATOIRES) :**
```
DATABASE_URL=postgresql://postgres:xqv6mjg_zuq7PBM7uke@db.wnugqzgzzwmebjjsfrns.supabase.co:5432/postgres
```

**Variables Meta API (OBLIGATOIRES) :**
```
META_APP_ID=votre_app_id
META_APP_SECRET=votre_app_secret
META_ACCESS_TOKEN=votre_access_token
META_AD_ACCOUNT_ID=votre_ad_account_id
```

**Variables de Configuration :**
```
NODE_ENV=production
CORS_ORIGIN=https://scout-interest.vercel.app
```

### 1.2 Comment configurer les variables dans Vercel
1. Allez sur https://vercel.com
2. Sélectionnez votre projet "scout-interest"
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez chaque variable une par une
5. Assurez-vous que **Production** est coché pour chaque variable

## 🔧 Étape 2 : Premier Déploiement

### 2.1 Aller sur Vercel
1. Allez sur https://vercel.com
2. Connectez-vous avec GitHub
3. Cliquez "New Project"

### 2.2 Importer le repository
1. Sélectionnez `angelogeraci/scout-Interest`
2. Cliquez "Import"

### 2.3 Configuration du projet
Configurez comme suit :
- **Framework Preset** : `Other`
- **Root Directory** : `/` (racine)
- **Build Command** : `cd frontend && npm run build`
- **Output Directory** : `frontend/build`
- **Install Command** : `cd frontend && npm install && cd ../backend && npm install`
- **Project Name** : `scout-interest`

### 2.4 Variables d'environnement (PREMIER DÉPLOIEMENT)
Ajoutez ces variables dans l'interface Vercel :

```
# Base de données Supabase (OBLIGATOIRE)
DATABASE_URL=postgresql://postgres:xqv6mjg_zuq7PBM7uke@db.wnugqzgzzwmebjjsfrns.supabase.co:5432/postgres

# Meta API (vos vraies valeurs)
META_APP_ID=votre_app_id
META_APP_SECRET=votre_app_secret
META_ACCESS_TOKEN=votre_access_token
META_AD_ACCOUNT_ID=votre_ad_account_id

# CORS temporaire (sera mis à jour)
CORS_ORIGIN=*

# Environment
NODE_ENV=production
```

### 2.5 Déployer
1. Cliquez "Deploy"
2. Attendez 2-3 minutes
3. **Notez l'URL générée** (ex: `https://scout-interest.vercel.app`)

## 🔧 Étape 3 : Configuration Finale

### 3.1 Mettre à jour CORS_ORIGIN
1. Dans Vercel, allez dans **Settings** > **Environment Variables**
2. Trouvez `CORS_ORIGIN`
3. Changez la valeur de `*` vers votre URL Vercel :
   ```
   CORS_ORIGIN=https://scout-interest.vercel.app
   ```

### 3.2 Redéployer
1. Allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. Cliquez "Redeploy"

## 🧪 Étape 4 : Tester l'Application

### 4.1 Test de base
1. Ouvrez votre URL Vercel
2. Vérifiez que l'interface se charge
3. Testez l'upload d'un fichier

### 4.2 Test de l'API
1. Testez : `https://scout-interest.vercel.app/api/health`
2. Vous devriez voir :
   ```json
   {
     "status": "OK",
     "timestamp": "2025-09-01T...",
     "environment": "production",
     "database_url": "configured",
     "services": {
       "database": "connected",
       "redis": "connected",
       "meta_api": "configured"
     }
   }
   ```

### 4.3 Test des projets
1. Testez : `https://scout-interest.vercel.app/api/test-projects`
2. Vous devriez voir :
   ```json
   {
     "success": true,
     "message": "Projects test endpoint",
     "data": {
       "success": true,
       "projects": []
     },
     "environment": "production",
     "database_url": "configured"
   }
   ```

### 4.4 Test complet
1. Upload un fichier Excel avec des codes postaux
2. Configurez le targeting
3. Lancez l'analyse
4. Vérifiez que les résultats sont sauvegardés dans Supabase

## 🐛 Dépannage

### Problème : "Project already exists"
- Le projet "scout-interest-3" existe déjà
- Utilisez le nom "scout-interest" dans la configuration
- Ou supprimez l'ancien projet dans Vercel

### Problème : "Database connection failed"
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que Supabase est actif
- Testez la connexion avec l'endpoint `/api/health`

### Problème : "Build failed"
- Vérifiez que les dépendances sont installées
- Vérifiez les logs de build dans Vercel

### Problème : "CORS error"
- Vérifiez que `CORS_ORIGIN` pointe vers votre URL Vercel
- Redéployez après modification

### Problème : "Meta API error"
- Vérifiez que vos tokens Meta sont valides
- Vérifiez les permissions de votre Ad Account

### Problème : "Erreur lors du chargement des projets"
- Vérifiez que `DATABASE_URL` est configurée dans Vercel
- Vérifiez que Supabase est accessible
- Testez l'endpoint `/api/test-projects`

## ✅ Vérification Finale

Après le déploiement, vous devriez avoir :
- ✅ Application accessible via URL Vercel
- ✅ API fonctionnelle
- ✅ Connexion à Supabase
- ✅ Meta API fonctionnelle
- ✅ Upload et traitement de fichiers
- ✅ Sauvegarde des résultats

## 🎯 URLs Finales

- **Frontend** : `https://scout-interest.vercel.app`
- **Backend API** : `https://scout-interest.vercel.app/api/*`
- **Health Check** : `https://scout-interest.vercel.app/api/health`
- **Test Projects** : `https://scout-interest.vercel.app/api/test-projects`

## 🚀 Déploiement Rapide avec CLI

Vous pouvez aussi utiliser le script de déploiement :

```bash
# Préparer le projet
./deploy.sh both

# Déployer avec Vercel CLI
./deploy.sh vercel
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans Vercel
2. Testez la connexion Supabase localement
3. Vérifiez les variables d'environnement
4. Consultez les logs de l'application
5. Testez les endpoints de diagnostic
