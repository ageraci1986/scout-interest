# 🎯 Scout Interest - Analyse d'Audience Meta par Codes Postaux

Application web complète pour analyser la taille d'audience Meta (Facebook Ads) en croisant des codes postaux avec des critères d'intérêts spécifiques.

## ✨ Fonctionnalités

### 📊 Analyse d'Audience
- **Reach Estimate par Code Postal** : Calcul de la taille d'audience pour chaque code postal individuellement
- **Reach Estimate avec Targeting** : Calcul avec critères d'intérêts, âge, genre, etc.
- **Traitement en Temps Réel** : Progression en direct avec statistiques
- **Export CSV/Excel** : Export des résultats avec encodage UTF-8 correct

### 📁 Gestion de Fichiers
- **Upload Excel/CSV** : Support des formats .xlsx, .xls, .csv
- **Détection Automatique** : Identification automatique des colonnes codes postaux
- **Validation** : Vérification des données avant traitement
- **Prévisualisation** : Aperçu des données avant analyse

### 🎯 Targeting Avancé
- **Recherche d'Intérêts** : Intégration avec l'API Meta Marketing
- **Sélecteur de Pays** : Support multi-pays (US, FR, etc.)
- **Paramètres Avancés** : Âge, genre, plateformes, etc.
- **Estimation en Temps Réel** : Prévisualisation de l'audience

## 🚀 Installation

### Prérequis
- Node.js 16+ 
- npm ou yarn
- Compte Meta Business avec accès API Marketing

### Configuration

1. **Cloner le repository**
```bash
git clone <repository-url>
cd scout-Interest
```

2. **Configuration Backend**
```bash
cd backend
npm install
cp env.example .env
```

3. **Configuration Frontend**
```bash
cd frontend
npm install
cp env.example .env
```

4. **Variables d'environnement**

**Backend (.env)**
```env
META_ACCESS_TOKEN=your_meta_access_token
META_AD_ACCOUNT_ID=act_your_ad_account_id
DATABASE_URL=your_database_url
```

**Frontend (.env)**
```env
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_META_AD_ACCOUNT_ID=act_your_ad_account_id
```

## 🏃‍♂️ Démarrage

### Développement
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

### Production
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## 📖 Utilisation

### 1. Upload de Fichier
- Allez sur `/upload`
- Glissez-déposez votre fichier Excel/CSV
- Vérifiez la prévisualisation des données
- Cliquez sur "Continuer vers l'analyse"

### 2. Configuration du Targeting
- Sélectionnez des intérêts via la recherche Meta
- Configurez les paramètres démographiques
- Vérifiez l'estimation d'audience en temps réel
- Validez la configuration

### 3. Traitement et Résultats
- Lancez le traitement des codes postaux
- Suivez la progression en temps réel
- Consultez les résultats dans le tableau
- Exportez les données en CSV/Excel

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── src/
│   ├── config/          # Configuration (Meta API, DB, Redis)
│   ├── routes/          # Routes API (Meta, Upload)
│   ├── services/        # Services métier
│   ├── middleware/      # Middleware (upload, validation)
│   └── workers/         # Workers pour traitement asynchrone
├── test-*.js           # Tests d'intégration
└── package.json
```

### Frontend (React/TypeScript)
```
frontend/
├── src/
│   ├── components/      # Composants réutilisables
│   ├── pages/          # Pages de l'application
│   ├── services/       # Services API
│   └── App.tsx         # Point d'entrée
├── public/             # Assets statiques
└── package.json
```

## 🔧 API Meta Integration

### Endpoints Utilisés
- `GET /search` : Recherche d'intérêts et codes postaux
- `GET /{ad_account_id}/reachestimate` : Calcul de reach estimate
- `GET /{ad_account_id}/targetingsentencelines` : Suggestions de targeting

### Format Targeting Spec
```javascript
{
  geo_locations: {
    zips: [{ key: "US:10001", name: "10001", country_code: "US" }]
  },
  age_min: 18,
  age_max: 65,
  genders: ["1", "2"],
  device_platforms: ["mobile", "desktop"],
  interests: [{ id: "6002714395372", name: "Technology" }]
}
```

## 🧪 Tests

### Tests Backend
```bash
cd backend
node test-complete-workflow.js
node test-meta-postal-codes.js
node test-targeting-country-code.js
```

### Tests Frontend
```bash
cd frontend
node test-complete-flow.js
node test-meta-connection.js
```

## 📊 Format des Données

### Fichier d'Entrée
- **Format** : Excel (.xlsx, .xls) ou CSV
- **Colonnes** : Au moins une colonne contenant des codes postaux
- **Détection** : Automatique des colonnes "postal", "code", "zip", etc.

### Fichier de Sortie
```csv
Code Postal,Pays,Audience Code Postal (min),Audience Code Postal (max),Audience avec Targeting (min),Audience avec Targeting (max),Statut,Erreur
10001,US,27300,32200,15000,18000,completed,
75001,FR,18500,22000,12000,15000,completed,
```

## 🔒 Sécurité

- **Rate Limiting** : Protection contre les abus API
- **Validation** : Vérification des données d'entrée
- **Authentification** : Tokens Meta sécurisés
- **CORS** : Configuration pour développement/production

## 🚀 Déploiement

### Heroku
```bash
# Backend
heroku create scout-interest-backend
git subtree push --prefix backend heroku main

# Frontend
heroku create scout-interest-frontend
git subtree push --prefix frontend heroku main
```

### Docker
```bash
docker-compose up -d
```

## 📝 Documentation API

### POST /api/upload/file
Upload et traitement de fichier

### POST /api/meta/reach-estimate
Calcul de reach estimate

### GET /api/meta/interests/search
Recherche d'intérêts

### POST /api/meta/postal-code-reach-estimate-v2
Reach estimate par code postal

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation Meta Marketing API
- Vérifiez les logs de l'application

---

**Scout Interest** - Optimisez vos campagnes publicitaires avec des données d'audience précises par code postal ! 🎯
