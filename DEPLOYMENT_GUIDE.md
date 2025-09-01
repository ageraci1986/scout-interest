# 🚀 Guide de Déploiement - Scout Interest (Vercel)

## 📋 Prérequis

1. **Compte Vercel** : https://vercel.com
2. **Compte Supabase** : https://supabase.com
3. **GitHub** : Votre code doit être sur GitHub

## 🔧 Étape 1 : Déployer sur Vercel (Frontend + Backend)

### 1.1 Préparer le projet
```bash
# Vérifier que tous les fichiers sont prêts
ls -la vercel.json
ls -la backend/vercel.json
ls -la frontend/vercel.json
```

### 1.2 Déployer sur Vercel
1. Connectez-vous à Vercel
2. Cliquez "New Project"
3. Importez votre repo GitHub
4. Configurez le projet :
   - **Framework Preset** : Other
   - **Root Directory** : `/` (racine du projet)
   - **Build Command** : `cd frontend && npm run build`
   - **Output Directory** : `frontend/build`
   - **Install Command** : `cd frontend && npm install && cd ../backend && npm install`

### 1.3 Variables d'environnement Vercel
Dans les paramètres du projet Vercel, ajoutez :
```
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_access_token
META_AD_ACCOUNT_ID=your_ad_account_id
CORS_ORIGIN=https://your-project.vercel.app
DATABASE_URL=your_postgresql_url
NODE_ENV=production
```

## ✅ Déploiement terminé !

Votre application est maintenant déployée sur Vercel avec :
- **Frontend** : React app accessible via l'URL principale
- **Backend** : API accessible via `/api/*` routes
- **Base de données** : PostgreSQL (vous devrez configurer une base de données externe)

### URLs générées :
- **Frontend** : `https://your-project.vercel.app`
- **Backend API** : `https://your-project.vercel.app/api/*`

## 🔧 Étape 3 : Configuration finale

### 3.1 Mettre à jour CORS dans le backend
Dans Railway, ajoutez la variable d'environnement :
```
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### 3.2 Tester l'application
1. Vérifiez que le frontend se connecte au backend
2. Testez les fonctionnalités principales
3. Vérifiez les logs dans Railway

## 🔧 Étape 4 : Domaine personnalisé (optionnel)

### 4.1 Vercel
1. Allez dans les paramètres du projet
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS

### 4.2 Railway
1. Ajoutez un domaine personnalisé pour le backend
2. Mettez à jour `CORS_ORIGIN` et `REACT_APP_API_URL`

## 🐛 Dépannage

### Problème de CORS
- Vérifiez que `CORS_ORIGIN` pointe vers votre frontend Vercel
- Redémarrez le backend après modification

### Problème de connexion API
- Vérifiez que `REACT_APP_API_URL` pointe vers votre backend Railway
- Vérifiez les logs Railway pour les erreurs

### Problème de build Vercel
- Vérifiez que le dossier racine est bien `frontend`
- Vérifiez les logs de build dans Vercel

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans Railway et Vercel
2. Testez localement avec les nouvelles URLs
3. Vérifiez les variables d'environnement
