# 🌍 Variables d'Environnement Complètes - Scout Interest Vercel

## 📋 Variables REQUISES (Obligatoires)

### 🔐 Base de Données Supabase
```bash
# Connexion principale (OBLIGATOIRE)
DATABASE_URL=postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres

# Configuration Supabase (OBLIGATOIRE)
SUPABASE_URL=https://wnugqzgzzwmebjjsfrns.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 🚀 Meta API (OBLIGATOIRE)
```bash
# Configuration Meta App
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
META_ACCESS_TOKEN=your_meta_access_token_here
META_AD_ACCOUNT_ID=act_123456789

# Version API Meta
META_API_VERSION=v18.0
```

### 🔒 Sécurité (OBLIGATOIRE)
```bash
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_production_min_32_chars

# API Key Hash (optionnel mais recommandé)
API_KEY_HASH=your_api_key_hash_here
```

## 📋 Variables IMPORTANTES (Recommandées)

### 🌐 Configuration Serveur
```bash
# Environment
NODE_ENV=production
PORT=3001

# CORS Configuration
CORS_ORIGIN=https://scout-interest.vercel.app
FRONTEND_URL=https://scout-interest.vercel.app
```

### 📁 Upload et Fichiers
```bash
# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,xls,csv
```

### ⚡ Performance et Rate Limiting
```bash
# Rate Limiting - Production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# Meta API Rate Limiting
META_RATE_LIMIT_CALLS_PER_HOUR=500
META_RATE_LIMIT_RETRY_DELAY=3000

# Compression
COMPRESSION_LEVEL=6
CACHE_CONTROL_MAX_AGE=3600
```

## 📋 Variables OPTIONNELLES (Améliorations)

### 🔧 Configuration Avancée
```bash
# Queue Configuration
QUEUE_CONCURRENCY=10
QUEUE_BATCH_SIZE=20

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Security
BCRYPT_ROUNDS=12

# Redis (si utilisé)
REDIS_URL=redis://localhost:6379
```

### 🎯 Configuration Meta API Avancée
```bash
# Meta API Environment
META_API_ENVIRONMENT=production

# Meta API Rate Limits Avancés
META_RATE_LIMIT_BURST=50
META_RATE_LIMIT_WINDOW=3600000
```

### 🚀 Configuration Frontend
```bash
# Frontend Environment
REACT_APP_API_URL=https://scout-interest.vercel.app/api
REACT_APP_ENV=production
REACT_APP_META_AD_ACCOUNT_ID=act_123456789

# Build Optimization
GENERATE_SOURCEMAP=false
REACT_APP_DISABLE_ESLINT_PLUGIN=true

# Performance
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
```

## 🚨 Variables CRITIQUES pour la Production

### 🔴 ABSOLUMENT REQUISES
```bash
DATABASE_URL=postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
META_ACCESS_TOKEN=your_meta_access_token_here
JWT_SECRET=your_super_secret_jwt_key_here_production_min_32_chars
```

### 🟡 TRÈS RECOMMANDÉES
```bash
SUPABASE_URL=https://wnugqzgzzwmebjjsfrns.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
CORS_ORIGIN=https://scout-interest.vercel.app
FRONTEND_URL=https://scout-interest.vercel.app
NODE_ENV=production
```

### 🟢 OPTIONNELLES MAIS UTILES
```bash
META_AD_ACCOUNT_ID=act_123456789
COMPRESSION_LEVEL=6
RATE_LIMIT_MAX_REQUESTS=200
LOG_LEVEL=info
```

## 🔧 Configuration dans Vercel

### 1. Interface Web Vercel
1. Allez sur https://vercel.com
2. Sélectionnez votre projet "scout-interest"
3. **Settings** > **Environment Variables**
4. Ajoutez chaque variable une par une
5. **IMPORTANT** : Cochez **Production** pour chaque variable

### 2. CLI Vercel
```bash
# Ajouter une variable
vercel env add DATABASE_URL production

# Lister les variables
vercel env ls

# Pull les variables locales
vercel env pull .env.production
```

### 3. Fichier .env.local
```bash
# Créer .env.local à la racine
cp backend/env.production .env.local

# Éditer avec vos vraies valeurs
nano .env.local
```

## 📊 Vérification des Variables

### Test de Connexion
```bash
# Test de la base de données
curl https://scout-interest.vercel.app/api/health

# Test des projets
curl https://scout-interest.vercel.app/api/test-projects
```

### Réponse Attendu
```json
{
  "status": "OK",
  "services": {
    "database": "connected",
    "meta_api": "configured",
    "cors": "https://scout-interest.vercel.app",
    "jwt": "configured"
  }
}
```

## 🚀 Script de Configuration Automatique

### Utiliser le Script
```bash
# Configuration complète
./deploy-vercel.sh full

# Ou manuellement
./deploy-vercel.sh both
vercel --prod
```

## ⚠️ Points d'Attention

### 🔴 Sécurité
- **JWT_SECRET** : Minimum 32 caractères, unique par environnement
- **META_ACCESS_TOKEN** : Token d'accès Meta valide et non expiré
- **DATABASE_URL** : URL de production Supabase, pas de développement

### 🟡 Performance
- **COMPRESSION_LEVEL** : 6 est optimal (équilibre performance/compression)
- **RATE_LIMIT_MAX_REQUESTS** : 200 par 15 minutes en production
- **META_RATE_LIMIT_CALLS_PER_HOUR** : 500 par heure pour Meta API

### 🟢 Monitoring
- **LOG_LEVEL** : "info" en production, "debug" en développement
- **NODE_ENV** : Toujours "production" sur Vercel

## ✅ Checklist de Configuration

- [ ] **DATABASE_URL** configurée avec Supabase production
- [ ] **META_APP_ID** et **META_APP_SECRET** configurés
- [ ] **META_ACCESS_TOKEN** valide et non expiré
- [ ] **JWT_SECRET** unique et sécurisé (32+ caractères)
- [ ] **CORS_ORIGIN** pointant vers votre domaine Vercel
- [ ] **NODE_ENV** = "production"
- [ ] Variables marquées comme **Production** dans Vercel
- [ ] Test de l'endpoint `/api/health` réussi
- [ ] Test de l'endpoint `/api/test-projects` réussi

## 🆘 En Cas de Problème

### Erreur "Database connection failed"
- Vérifiez `DATABASE_URL` dans Vercel
- Testez la connexion Supabase localement
- Vérifiez que Supabase est actif

### Erreur "Meta API not configured"
- Vérifiez `META_ACCESS_TOKEN` dans Vercel
- Testez le token avec l'API Meta
- Vérifiez les permissions de votre Ad Account

### Erreur "CORS error"
- Vérifiez `CORS_ORIGIN` dans Vercel
- Assurez-vous qu'il pointe vers votre URL Vercel
- Redéployez après modification

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans Vercel
2. Testez les endpoints de diagnostic
3. Vérifiez la configuration des variables
4. Consultez la documentation Vercel

