# 🚀 Configuration Rapide Variables Vercel - Scout Interest

## ⚡ Configuration Express (5 minutes)

### 1. 🌐 Aller sur Vercel
- Ouvrez https://vercel.com
- Connectez-vous avec GitHub
- Sélectionnez votre projet "scout-interest"

### 2. ⚙️ Configuration des Variables
- Allez dans **Settings** > **Environment Variables**
- Cliquez **Add New** pour chaque variable

## 🔴 Variables CRITIQUES (À configurer en premier)

### Base de Données Supabase
```bash
Name: DATABASE_URL
Value: postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
Environment: Production ✅
```

```bash
Name: SUPABASE_URL
Value: https://wnugqzgzzwmebjjsfrns.supabase.co
Environment: Production ✅
```

```bash
Name: SUPABASE_ANON_KEY
Value: [Votre clé anonyme Supabase]
Environment: Production ✅
```

### Meta API
```bash
Name: META_APP_ID
Value: [Votre ID d'application Meta]
Environment: Production ✅
```

```bash
Name: META_APP_SECRET
Value: [Votre secret d'application Meta]
Environment: Production ✅
```

```bash
Name: META_ACCESS_TOKEN
Value: [Votre token d'accès Meta]
Environment: Production ✅
```

```bash
Name: META_AD_ACCOUNT_ID
Value: [Votre ID de compte publicitaire Meta]
Environment: Production ✅
```

### Sécurité
```bash
Name: JWT_SECRET
Value: [Clé secrète de 32+ caractères]
Environment: Production ✅
```

## 🟡 Variables IMPORTANTES

### Configuration Serveur
```bash
Name: NODE_ENV
Value: production
Environment: Production ✅
```

```bash
Name: CORS_ORIGIN
Value: https://scout-interest.vercel.app
Environment: Production ✅
```

```bash
Name: FRONTEND_URL
Value: https://scout-interest.vercel.app
Environment: Production ✅
```

## ✅ Checklist Rapide

- [ ] **DATABASE_URL** - URL Supabase production
- [ ] **SUPABASE_URL** - URL projet Supabase
- [ ] **SUPABASE_ANON_KEY** - Clé anonyme Supabase
- [ ] **META_APP_ID** - ID app Meta
- [ ] **META_APP_SECRET** - Secret app Meta
- [ ] **META_ACCESS_TOKEN** - Token Meta valide
- [ ] **META_AD_ACCOUNT_ID** - ID compte publicitaire
- [ ] **JWT_SECRET** - Clé JWT 32+ caractères
- [ ] **NODE_ENV** = production
- [ ] **CORS_ORIGIN** = votre URL Vercel
- [ ] Toutes les variables marquées **Production**

## 🚀 Déploiement Immédiat

### Option 1: Script Automatique
```bash
./deploy-vercel.sh full
```

### Option 2: Manuel
```bash
vercel --prod
```

## 🧪 Test Rapide

Après déploiement, testez :
```bash
# Health check
curl https://scout-interest.vercel.app/api/health

# Test projets
curl https://scout-interest.vercel.app/api/test-projects
```

## 🆘 Dépannage Rapide

### Erreur "Database connection failed"
- ✅ Vérifiez `DATABASE_URL` dans Vercel
- ✅ Testez la connexion Supabase localement

### Erreur "Meta API not configured"
- ✅ Vérifiez `META_ACCESS_TOKEN` dans Vercel
- ✅ Testez le token avec l'API Meta

### Erreur "CORS error"
- ✅ Vérifiez `CORS_ORIGIN` dans Vercel
- ✅ Redéployez après modification

## 📱 Configuration Mobile

### Variables Minimales pour Test
```bash
DATABASE_URL=✅
META_ACCESS_TOKEN=✅
JWT_SECRET=✅
CORS_ORIGIN=✅
NODE_ENV=production
```

## 🎯 Prochaines Étapes

1. ✅ **Configurez les variables CRITIQUES**
2. 🔄 **Déployez avec Vercel**
3. 🧪 **Testez les endpoints**
4. 🚀 **Votre app est en ligne !**

## 📞 Support Express

**Problème urgent ?**
1. Vérifiez les logs Vercel
2. Testez `/api/health`
3. Vérifiez les variables d'environnement
4. Redéployez si nécessaire

**Temps estimé : 5-10 minutes pour la configuration complète !**

