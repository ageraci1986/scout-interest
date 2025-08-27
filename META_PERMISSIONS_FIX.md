# 🔧 Résolution des Problèmes de Permissions Meta

## 🚨 Problème Actuel

L'estimation d'audience retourne 0, ce qui indique un problème de permissions sur l'Ad Account.

## 🔍 Diagnostic

### 1. Vérifier les Permissions de l'Ad Account

1. **Allez sur** [Meta Business Manager](https://business.facebook.com/)
2. **Sélectionnez votre Ad Account** (`act_379481728925498`)
3. **Cliquez sur "Settings"** dans le menu de gauche
4. **Vérifiez les permissions** :
   - `ads_management` ✅
   - `ads_read` ✅
   - `business_management` ✅

### 2. Vérifier le Statut de l'Ad Account

- **Status** : Doit être "Active"
- **Type** : Doit être "Business" (pas "Personal")
- **Billing** : Doit avoir une méthode de paiement configurée

### 3. Vérifier les Permissions de l'Access Token

1. **Allez sur** [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. **Sélectionnez votre app**
3. **Vérifiez les permissions** :
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `read_insights`

## 🛠️ Solutions

### Solution 1: Régénérer l'Access Token

1. **Allez sur** [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. **Cliquez sur "Generate Access Token"**
3. **Sélectionnez toutes les permissions nécessaires**
4. **Copiez le nouveau token**
5. **Mettez à jour** `backend/.env` :
   ```env
   META_ACCESS_TOKEN=votre_nouveau_token
   ```

### Solution 2: Vérifier l'Ad Account ID

1. **Allez sur** [Meta Business Manager](https://business.facebook.com/)
2. **Sélectionnez "Ad Accounts"**
3. **Vérifiez que** `act_379481728925498` est bien actif
4. **Si non, utilisez un autre Ad Account** et mettez à jour `backend/.env`

### Solution 3: Créer un Nouvel Ad Account

1. **Allez sur** [Meta Business Manager](https://business.facebook.com/)
2. **Cliquez sur "Ad Accounts" > "Add"**
3. **Créez un nouvel Ad Account**
4. **Copiez le nouvel Ad Account ID**
5. **Mettez à jour** `backend/.env` :
   ```env
   META_AD_ACCOUNT_ID=act_nouveau_id
   ```

## 🧪 Test de Permissions

Testez les permissions avec :

```bash
# Test de l'Ad Account
curl -s "http://localhost:3001/api/meta/ad-account" | jq .

# Test de recherche d'intérêts
curl -s "http://localhost:3001/api/meta/interests/search?q=fitness&limit=3" | jq .

# Test d'estimation d'audience
curl -s -X POST "http://localhost:3001/api/meta/delivery-estimate" \
  -H "Content-Type: application/json" \
  -d '{
    "adAccountId": "act_379481728925498",
    "targetingSpec": {
      "interests": [{"id": "6003107902433", "name": "Football"}],
      "geo_locations": [{"countries": ["US"]}],
      "age_min": 18,
      "age_max": 65,
      "genders": ["1", "2"],
      "device_platforms": ["facebook", "instagram"]
    }
  }' | jq .
```

## 📊 Solution Temporaire

En attendant la résolution des permissions, l'application utilise une **estimation calculée** basée sur :
- Les données d'audience des intérêts sélectionnés
- Les filtres de targeting appliqués
- Les facteurs de correction par pays

Cette estimation est affichée avec le label **"estimation calculée"**.

## 🔗 Ressources

- [Meta Business Manager](https://business.facebook.com/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Documentation Permissions](https://developers.facebook.com/docs/marketing-api/access)
- [Guide Ad Accounts](https://developers.facebook.com/docs/marketing-api/reference/ad-account)

## 🆘 Support

Si les problèmes persistent :
1. Vérifiez les logs du backend
2. Testez avec un autre Ad Account
3. Contactez Meta Support
4. Utilisez l'estimation calculée en attendant
