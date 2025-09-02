# Guide de Résolution du Problème d'Upload

## Problème Identifié

L'erreur "Server error: Internal server error" lors de l'upload de fichiers Excel est causée par l'absence de la table `file_uploads` dans la base de données Supabase.

## Solution

### 1. Appliquer le Schéma Supabase

Exécutez le script pour créer la table manquante :

```bash
cd backend
DATABASE_URL="postgresql://postgres.wnugqzgzzwmebjjsfrns:VOTRE_MOT_DE_PASSE@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" node apply-supabase-schema.js
```

### 2. Vérifier les Tables

Le script vérifiera que les tables suivantes existent :
- ✅ `projects` - Table des projets
- ✅ `file_uploads` - Table des uploads de fichiers (NOUVELLE)
- ✅ `processing_results` - Table des résultats de traitement

### 3. Tester l'Upload

Après avoir appliqué le schéma, testez l'upload :

```bash
# Test local
cd backend
npm start

# Dans un autre terminal
node test-upload-fix.js
```

### 4. Redéployer sur Vercel

Après avoir appliqué le schéma, redéployez l'application :

```bash
./deploy.sh vercel
```

## Corrections Apportées

### 1. Ajout de la Table `file_uploads`

```sql
CREATE TABLE IF NOT EXISTS file_uploads (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    upload_path TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    validation_errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Correction de la Route Upload

- Correction de l'appel à `db.run()` au lieu de `db.query()`
- Ajout du paramètre manquant pour `generatePreview()`
- Amélioration de la gestion d'erreurs

### 3. Politiques RLS

Ajout des politiques de sécurité pour la table `file_uploads` :
- Lecture des uploads de ses propres projets
- Insertion d'uploads pour ses propres projets
- Mise à jour des uploads de ses propres projets
- Suppression des uploads de ses propres projets

## Vérification

Après avoir appliqué le schéma, vous devriez voir :

```
✅ Schema applied successfully!
📋 Tables found: ['projects', 'file_uploads', 'processing_results']
✅ Table 'projects' exists
✅ Table 'file_uploads' exists
✅ Table 'processing_results' exists
✅ Schema verification completed!
```

## Test de l'Upload

L'upload devrait maintenant fonctionner correctement avec :
- ✅ Validation des fichiers Excel/CSV
- ✅ Traitement des codes postaux
- ✅ Sauvegarde en base de données
- ✅ Génération de prévisualisation

## Résolution des Problèmes

### Erreur "relation does not exist"
- Exécutez le script `apply-supabase-schema.js`
- Vérifiez que la `DATABASE_URL` est correcte

### Erreur de permissions
- Vérifiez que les politiques RLS sont correctement appliquées
- Assurez-vous que l'utilisateur a les bonnes permissions

### Erreur de traitement de fichier
- Vérifiez que le fichier est au bon format (Excel/CSV)
- Assurez-vous que le fichier contient une colonne de codes postaux
