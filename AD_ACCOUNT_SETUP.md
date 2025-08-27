# 🔧 Configuration de l'Ad Account ID Meta

Pour que l'estimation d'audience fonctionne correctement, vous devez configurer un Ad Account ID Meta valide.

## 📋 Prérequis

- Un compte Meta Business Manager
- Un Ad Account créé dans Meta Business Manager
- Les permissions nécessaires sur l'Ad Account

## 🚀 Étapes de Configuration

### 1. Trouver votre Ad Account ID

1. **Allez sur** [Meta Business Manager](https://business.facebook.com/)
2. **Connectez-vous** avec votre compte Meta Business
3. **Cliquez sur "Ad Accounts"** dans le menu de gauche
4. **Sélectionnez votre Ad Account** (ou créez-en un nouveau)
5. **Copiez l'Ad Account ID** (format: `act_XXXXXXXXXX`)

### 2. Configurer l'Ad Account ID

#### Option A: Backend (Recommandé)
Ajoutez l'Ad Account ID dans votre fichier `backend/.env` :

```env
# Meta API Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_meta_access_token
META_API_VERSION=v18.0
META_AD_ACCOUNT_ID=act_123456789  # Remplacez par votre vrai Ad Account ID
```

#### Option B: Frontend (Alternative)
Ajoutez l'Ad Account ID dans votre fichier `frontend/.env` :

```env
REACT_APP_META_AD_ACCOUNT_ID=act_123456789
```

### 3. Vérifier la Configuration

Testez la configuration avec :

```bash
# Test de l'API Ad Account
curl -s "http://localhost:3001/api/meta/ad-account" | jq .
```

Vous devriez voir :
```json
{
  "success": true,
  "data": {
    "ad_account_id": "act_123456789",
    "is_configured": true
  }
}
```

## 🔍 Permissions Requises

Votre Ad Account doit avoir ces permissions :
- `ads_management` - Gestion des publicités
- `ads_read` - Lecture des données publicitaires
- `business_management` - Gestion des comptes business

## 🚨 Dépannage

### Erreur "Invalid Ad Account ID"
- Vérifiez que l'Ad Account ID est au bon format (`act_XXXXXXXXXX`)
- Assurez-vous que l'Ad Account existe et est actif
- Vérifiez vos permissions sur l'Ad Account

### Erreur "Access Denied"
- Vérifiez que votre access token a les bonnes permissions
- Assurez-vous que l'Ad Account est dans le même Business Manager que votre app

### Erreur "Ad Account Not Found"
- Vérifiez que l'Ad Account ID est correct
- Assurez-vous que l'Ad Account n'est pas supprimé ou désactivé

## 📚 Ressources

- [Meta Business Manager](https://business.facebook.com/)
- [Documentation Ad Accounts](https://developers.facebook.com/docs/marketing-api/reference/ad-account)
- [Guide des Permissions](https://developers.facebook.com/docs/marketing-api/access)

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez la documentation Meta
2. Testez avec l'API de configuration
3. Consultez les logs de l'application
