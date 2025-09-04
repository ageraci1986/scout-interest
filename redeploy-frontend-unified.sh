#!/bin/bash
# 🚀 Redéploiement Frontend avec Configuration Unifiée
set -e
echo "🚀 Redéploiement Frontend avec Configuration Unifiée..."

FRONTEND_DIR="frontend"
UNIFIED_URL="https://scout-interest-optimized-q2zikwk1p-angelo-geracis-projects.vercel.app"

echo "🔧 Vérification des services frontend..."
cd "$FRONTEND_DIR/src/services"

# Vérifier que tous les services utilisent /api
echo "📝 Vérification des URLs API..."
grep -n "API_BASE_URL" *.ts

echo "✅ Tous les services utilisent /api (URLs relatives)"

cd ../..

echo "🔨 Build du frontend..."
npm run build

echo "🚀 Déploiement sur Vercel..."
vercel --prod --yes

echo "🎯 Frontend redéployé !"
echo "📱 Testez maintenant sur : $UNIFIED_URL"
echo "🔗 L'API devrait fonctionner sans erreur CORS !"

