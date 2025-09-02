# Guide de Configuration Supabase

## Problème Identifié

L'ancienne URL Supabase (`db.wnugqzgzzwmebjjsfrns.supabase.co`) ne se résout plus. Supabase utilise maintenant le pooler de connexion avec l'URL `aws-1-eu-west-3.pooler.supabase.com`.

## Solution

### 1. Nouvelle URL de Connexion

Utilisez cette URL format pour votre `DATABASE_URL` :

```
postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

### 2. Configuration Locale

Créez un fichier `.env` dans le dossier `backend/` :

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres.wnugqzgzzwmebjjsfrns:VOTRE_MOT_DE_PASSE@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
NODE_ENV=development
```

### 3. Configuration Vercel

Dans votre projet Vercel, mettez à jour la variable d'environnement `DATABASE_URL` avec la nouvelle URL.

### 4. Test de Connexion

Pour tester la connexion localement :

```bash
cd backend
DATABASE_URL="postgresql://postgres.wnugqzgzzwmebjjsfrns:VOTRE_MOT_DE_PASSE@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" node test-supabase-full.js
```

### 5. Où Trouver Votre Mot de Passe

1. Connectez-vous à votre dashboard Supabase
2. Allez dans Settings > Database
3. Copiez la "Connection string" ou le "Database password"

### 6. Vérification

Le script de test vérifiera :
- ✅ Résolution DNS
- ✅ Connexion PostgreSQL
- ✅ Authentification
- ✅ Tables de l'application

## Déploiement

Après avoir mis à jour la `DATABASE_URL` sur Vercel, redéployez votre application :

```bash
./deploy.sh vercel
```

## Résolution des Problèmes

### Erreur DNS
Si vous obtenez `ENOTFOUND`, vérifiez que l'URL utilise bien `aws-1-eu-west-3.pooler.supabase.com`.

### Erreur d'Authentification
Vérifiez que le mot de passe dans l'URL est correct.

### Erreur de Connexion
Assurez-vous que votre projet Supabase est actif et que les paramètres de connexion sont corrects.
