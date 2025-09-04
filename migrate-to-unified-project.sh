#!/bin/bash
# 🚀 Migration vers Projet Unifié Scout Interest
set -e
echo "🚀 Migration vers Projet Unifié Scout Interest..."

# Sauvegarder les configurations actuelles
echo "📁 Sauvegarde des configurations actuelles..."
cp vercel.json vercel.json.backup
cp frontend/vercel.json frontend/vercel.json.backup

# Remplacer la configuration racine
echo "📝 Configuration unifiée..."
cp vercel-unified.json vercel.json

# Supprimer la configuration frontend séparée
echo "🗑️ Suppression de la configuration frontend séparée..."
rm frontend/vercel.json

# Revenir aux URLs relatives dans les services
echo "🔧 Mise à jour des services frontend..."
cd frontend/src/services

# ProjectService
sed -i '' 's|https://scout-interest-optimized-lwolbw6lc-angelo-geracis-projects.vercel.app/api|/api|g' projectService.ts

# MetaService  
sed -i '' 's|https://scout-interest-optimized-lwolbw6lc-angelo-geracis-projects.vercel.app/api|/api|g' metaService.ts

# UploadService
sed -i '' 's|https://scout-interest-optimified-lwolbw6lc-angelo-geracis-projects.vercel.app/api|/api|g' uploadService.ts

cd ../..

echo "✅ Configuration unifiée en place !"
echo "🚀 Déploiement du projet unifié..."
vercel --prod --yes

echo "🎯 Projet unifié déployé !"
echo "📱 Votre application sera accessible sur une seule URL !"

