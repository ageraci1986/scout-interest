# 🚀 Configuration Vercel Backend - Scout Interest

## 📋 Configuration Optimisée

### 1. Fichier `vercel.json` Backend
- **Build optimisé** : Configuration spéciale pour Node.js avec `@vercel/node`
- **Taille maximale** : Limite de 15MB pour les fonctions Lambda
- **Fichiers inclus** : Sélection optimisée des fichiers nécessaires
- **Routes optimisées** : Gestion intelligente des endpoints API

### 2. Variables d'Environnement Production
```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration - Supabase (Production)
DATABASE_URL=postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres

# Meta API Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_meta_access_token

# CORS Configuration - Production
CORS_ORIGIN=https://scout-interest.vercel.app
FRONTEND_URL=https://scout-interest.vercel.app

# Performance - Production
COMPRESSION_LEVEL=6
CACHE_CONTROL_MAX_AGE=3600
```

### 3. Scripts de Build Optimisés
```json
{
  "scripts": {
    "vercel-build": "npm install --production",
    "vercel-dev": "npm run dev"
  }
}
```

## 🔧 Optimisations Implémentées

### Performance
- ✅ **Compression** : Gzip automatique avec niveau configurable
- ✅ **Rate limiting** : Protection contre les abus avec limites configurables
- ✅ **Memory optimization** : Gestion intelligente de la mémoire
- ✅ **Garbage collection** : Optimisation automatique en production

### Sécurité
- ✅ **CORS configuré** : Origine restreinte à la production
- ✅ **Rate limiting** : Protection contre les attaques DDoS
- ✅ **Headers de sécurité** : Configuration automatique des headers CORS
- ✅ **Validation des entrées** : Protection contre les injections

### Build
- ✅ **Installation optimisée** : Dépendances de production uniquement
- ✅ **Fichiers inclus** : Sélection intelligente des fichiers nécessaires
- ✅ **Configuration Lambda** : Timeout et mémoire optimisés
- ✅ **Routes intelligentes** : Gestion automatique des endpoints

## 🚀 Configuration des Fonctions

### Lambda Function
```json
{
  "functions": {
    "src/server.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### Paramètres
- **Max Duration** : 30 secondes (limite Vercel)
- **Memory** : 1024 MB (1 GB)
- **Size Limit** : 15 MB maximum

## 📊 Endpoints API

### Health Check
- **URL** : `/api/health`
- **Méthode** : GET
- **Fonction** : Vérification de l'état des services

### Meta API
- **URL** : `/api/meta/*`
- **Méthode** : GET, POST
- **Fonction** : Intégration avec l'API Meta

### Upload
- **URL** : `/api/upload/*`
- **Méthode** : POST
- **Fonction** : Traitement des fichiers Excel/CSV

### Projects
- **URL** : `/api/projects/*`
- **Méthode** : GET, POST, PUT, DELETE
- **Fonction** : Gestion des projets d'analyse

## 🔍 Monitoring et Debug

### Logs Vercel
- **Build logs** : Accessibles dans l'interface Vercel
- **Runtime logs** : Logs des fonctions serverless
- **Performance** : Métriques automatiques

### Health Check Détail
```json
{
  "status": "OK",
  "timestamp": "2025-01-XX...",
  "environment": "production",
  "version": "2.0.0-optimized",
  "services": {
    "database": "connected",
    "meta_api": "configured",
    "cors": "https://scout-interest.vercel.app",
    "jwt": "configured"
  },
  "features": {
    "parallel_processor": "optimized",
    "authentication": "enhanced",
    "rate_limiting": "enabled",
    "caching": "enabled"
  }
}
```

## 🎯 Optimisations Spécifiques Vercel

### Compression
- **Niveau** : 6 (équilibre performance/compression)
- **Seuil** : 1024 bytes minimum
- **Filtrage** : Possibilité de désactiver par header

### Rate Limiting
- **Fenêtre** : 15 minutes configurable
- **Limite** : 100-200 requêtes par IP (configurable)
- **Headers** : Retry-After automatique

### CORS
- **Origines autorisées** : scout-interest.vercel.app
- **Méthodes** : GET, POST, PUT, DELETE, OPTIONS
- **Headers** : Content-Type, Authorization, X-Requested-With

## 🚀 Déploiement

### 1. Build Local (Test)
```bash
cd backend
npm run vercel-build
```

### 2. Déploiement Vercel
```bash
# Depuis la racine du projet
vercel --prod
```

### 3. Configuration Automatique
- **Framework** : Détecté automatiquement comme Node.js
- **Build Command** : `npm run vercel-build`
- **Output Directory** : `src`
- **Install Command** : `npm install --production`

## 📚 Ressources

- [Documentation Vercel Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Node.js on Vercel](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/nodejs)
- [Performance Optimization](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

