# 🔑 Configuration des Clés Meta API

Ce guide vous explique comment configurer les clés Meta nécessaires pour l'application Scout Interest.

## 📋 Prérequis

- Un compte Facebook Business
- Une application Meta créée sur [Facebook Developers](https://developers.facebook.com/)

## 🚀 Étapes de Configuration

### 1. Créer une Application Meta

1. **Allez sur** [Facebook Developers](https://developers.facebook.com/)
2. **Cliquez sur "Créer une App"**
3. **Sélectionnez "Business"** comme type d'application
4. **Remplissez les informations** :
   - Nom de l'application : `Scout Interest`
   - Email de contact : votre email
   - Catégorie : `Business`

### 2. Configurer les Permissions

Dans votre application Meta, ajoutez ces permissions :

- `ads_management` - Gestion des publicités
- `ads_read` - Lecture des données publicitaires
- `business_management` - Gestion des comptes business
- `read_insights` - Lecture des insights

### 3. Récupérer les Clés

#### App ID et App Secret
1. Dans votre app Meta, allez dans **Paramètres > Général**
2. Copiez l'**App ID** et l'**App Secret**

#### Access Token
1. Allez dans **Outils > Graph API Explorer**
2. Sélectionnez votre application
3. Cliquez sur **"Générer un token d'accès"**
4. Sélectionnez les permissions nécessaires
5. Copiez le token généré

### 4. Configurer le Fichier .env

Créez le fichier `backend/.env` :

```bash
cp backend/env.example backend/.env
```

Éditez `backend/.env` avec vos vraies clés :

```env
# Meta API Configuration
META_APP_ID=1234567890123456
META_APP_SECRET=abcdef1234567890abcdef1234567890
META_ACCESS_TOKEN=EAABwzLixnjYBO...
META_API_VERSION=v18.0
```

### 5. Tester la Configuration

```bash
cd backend
node test-meta-config.js
```

## 🔒 Sécurité

- **Ne jamais commiter** le fichier `.env` dans Git
- **Gardez vos clés secrètes** et ne les partagez pas
- **Utilisez des tokens de développement** pour les tests
- **Renouvelez régulièrement** vos tokens d'accès

## 🚨 Dépannage

### Erreur "Invalid access token"
- Vérifiez que votre token est valide
- Régénérez un nouveau token si nécessaire

### Erreur "Insufficient permissions"
- Vérifiez que toutes les permissions sont activées
- Contactez Meta pour demander des permissions supplémentaires

### Erreur "Rate limit exceeded"
- Attendez que la limite soit réinitialisée
- Optimisez vos appels API

## 📚 Ressources

- [Documentation Meta Marketing API](https://developers.facebook.com/docs/marketing-apis/)
- [Guide des permissions](https://developers.facebook.com/docs/facebook-login/permissions/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez la documentation Meta
2. Consultez les logs de l'application
3. Testez avec le script `test-meta-config.js`
