#!/bin/bash
# 🚨 FORCE REDÉPLOIEMENT COMPLET - Scout Interest
set -e
echo "🚨 FORCE REDÉPLOIEMENT COMPLET..."

echo "🔧 Étape 1: Vérification des services frontend..."
cd frontend/src/services

echo "📝 URLs API dans les services :"
echo "ProjectService:"
grep -n "API_BASE_URL" projectService.ts
echo "MetaService:"
grep -n "API_BASE_URL" metaService.ts
echo "UploadService:"
grep -n "API_BASE_URL" uploadService.ts

cd ../..

echo "🧹 Étape 2: Nettoyage complet..."
rm -rf frontend/build
rm -rf frontend/node_modules
rm -rf frontend/.vercel

echo "📦 Étape 3: Réinstallation des dépendances..."
cd frontend
npm install

echo "🔨 Étape 4: Build complet..."
npm run build

echo "🚀 Étape 5: Déploiement forcé frontend..."
vercel --prod --yes --force

cd ..

echo "🔄 Étape 6: Redéploiement backend..."
vercel --prod --yes

echo "🎯 Étape 7: Test final..."
sleep 10
NEW_URL=$(vercel ls | grep "scout-interest-optimized" | tail -1 | awk '{print $2}')
echo "📱 Nouvelle URL: $NEW_URL"

echo "🧪 Test de l'API..."
curl -s "$NEW_URL/api/health" | head -3

echo "🎉 REDÉPLOIEMENT COMPLET TERMINÉ !"
echo "📱 Testez maintenant votre application !"

