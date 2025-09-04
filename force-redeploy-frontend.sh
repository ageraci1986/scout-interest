#!/bin/bash
# 🚨 Force Redéploiement Frontend - Scout Interest
set -e
echo "🚨 Force Redéploiement Frontend..."

FRONTEND_DIR="frontend"
UNIFIED_URL="https://scout-interest-optimized-q2zikwk1p-angelo-geracis-projects.vercel.app"

echo "🔧 Vérification des services..."
cd "$FRONTEND_DIR/src/services"

echo "📝 URLs API dans les services :"
echo "ProjectService:"
grep -n "API_BASE_URL" projectService.ts
echo "MetaService:"
grep -n "API_BASE_URL" metaService.ts
echo "UploadService:"
grep -n "API_BASE_URL" uploadService.ts

cd ../..

echo "🧹 Nettoyage du build..."
rm -rf "$FRONTEND_DIR/build"

echo "🔨 Build complet..."
cd "$FRONTEND_DIR"
npm run build

echo "🚀 Déploiement forcé..."
vercel --prod --yes --force

cd ..

echo "🎯 Frontend redéployé avec force !"
echo "📱 Testez maintenant sur : $UNIFIED_URL"
echo "🔗 Les erreurs CORS devraient être résolues !"

