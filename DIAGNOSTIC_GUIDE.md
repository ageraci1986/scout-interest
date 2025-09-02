# 🔍 Guide de Diagnostic - Erreur de Chargement des Projets

## 📋 Problème
"Erreur lors du chargement des projets" - L'application ne parvient pas à charger les projets depuis l'API.

## 🔧 Étapes de Diagnostic

### 1. Vérifier les Variables d'Environnement Vercel

1. Allez sur https://vercel.com
2. Sélectionnez votre projet "scout-interest"
3. **Settings** > **Environment Variables**
4. Vérifiez que ces variables sont configurées :

```
DATABASE_URL=postgresql://postgres:xqv6mjg_zuq7PBM7uke@db.wnugqzgzzwmebjjsfrns.supabase.co:5432/postgres
NODE_ENV=production
CORS_ORIGIN=https://scout-interest.vercel.app
```

### 2. Tester l'API en Local

Exécutez ces commandes dans votre terminal :

```bash
# Tester la connexion à la base de données
cd backend
node test-database-connection.js

# Démarrer le serveur local
npm start
```

Puis testez dans votre navigateur :
- http://localhost:3001/api/test
- http://localhost:3001/api/health
- http://localhost:3001/api/test-projects

### 3. Vérifier les Logs de l'Application

1. Ouvrez votre application Vercel dans le navigateur
2. Ouvrez les **Outils de développement** (F12)
3. Allez dans l'onglet **Console**
4. Naviguez vers la page des projets
5. Regardez les logs pour identifier l'erreur

### 4. Tester les Endpoints API

Dans la console du navigateur, testez :

```javascript
// Test simple
fetch('/api/test')
  .then(res => res.json())
  .then(data => console.log('Test API:', data))
  .catch(err => console.error('Erreur test:', err));

// Test des projets
fetch('/api/projects/user/anonymous')
  .then(res => res.json())
  .then(data => console.log('Projets:', data))
  .catch(err => console.error('Erreur projets:', err));
```

### 5. Vérifier la Configuration CORS

Dans la console du navigateur, vérifiez les erreurs CORS :

```javascript
// Test avec l'URL complète
fetch('https://scout-interest.vercel.app/api/test')
  .then(res => res.json())
  .then(data => console.log('Test complet:', data))
  .catch(err => console.error('Erreur complète:', err));
```

## 🐛 Problèmes Courants

### Problème : "Network Error"
- **Cause** : L'API n'est pas accessible
- **Solution** : Vérifier que l'application est déployée et que les variables d'environnement sont configurées

### Problème : "CORS Error"
- **Cause** : Configuration CORS incorrecte
- **Solution** : Vérifier que `CORS_ORIGIN` pointe vers la bonne URL

### Problème : "Database connection failed"
- **Cause** : Connexion à Supabase échoue
- **Solution** : Vérifier `DATABASE_URL` et que Supabase est actif

### Problème : "404 Not Found"
- **Cause** : Routes API mal configurées
- **Solution** : Vérifier la configuration Vercel et les routes

## 📊 Logs de Diagnostic

L'application affiche maintenant des logs détaillés dans la console :

```
🔍 ProjectService - API_BASE_URL: /api
🔍 ProjectService - REACT_APP_API_URL: undefined
📋 Getting user projects with URL: /api/projects/user/anonymous
❌ Error getting user projects: [détails de l'erreur]
```

## 🎯 Solutions

### Si l'API_BASE_URL est incorrect :
1. Vérifiez que `REACT_APP_API_URL` est configurée dans Vercel
2. Ou utilisez l'URL complète dans le code

### Si la base de données ne répond pas :
1. Vérifiez `DATABASE_URL` dans Vercel
2. Testez la connexion Supabase localement
3. Vérifiez que Supabase est actif

### Si CORS bloque les requêtes :
1. Mettez à jour `CORS_ORIGIN` avec l'URL correcte
2. Redéployez l'application

## 📞 Support

Si le problème persiste :
1. Copiez les logs de la console
2. Vérifiez les variables d'environnement Vercel
3. Testez les endpoints en local
4. Contactez le support avec les détails
