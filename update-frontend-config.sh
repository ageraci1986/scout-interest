#!/bin/bash
# 🔧 Mise à Jour de la Configuration Frontend
# Script pour mettre à jour l'URL du backend dans le frontend

set -e

echo "🔧 Mise à Jour de la Configuration Frontend..."

# Configuration
FRONTEND_DIR="frontend"
NEW_BACKEND_URL="https://scout-interest-optimized-lwolbw6lc-angelo-geracis-projects.vercel.app"

echo "📁 Mise à jour depuis: $(pwd)"
echo "🔄 Nouvelle URL Backend: $NEW_BACKEND_URL"

# Vérifier si le fichier de configuration existe
if [ -f "$FRONTEND_DIR/src/services/metaService.ts" ]; then
    echo "📝 Mise à jour de metaService.ts..."
    
    # Sauvegarder l'ancien fichier
    cp "$FRONTEND_DIR/src/services/metaService.ts" "$FRONTEND_DIR/src/services/metaService.ts.backup"
    
    # Mettre à jour l'URL du backend
    sed -i '' "s|https://scout-interest-optimized-[^/]*\.vercel\.app|$NEW_BACKEND_URL|g" "$FRONTEND_DIR/src/services/metaService.ts"
    
    echo "✅ metaService.ts mis à jour"
else
    echo "⚠️  Fichier metaService.ts non trouvé"
fi

# Vérifier et mettre à jour d'autres fichiers de service
if [ -f "$FRONTEND_DIR/src/services/projectService.ts" ]; then
    echo "📝 Mise à jour de projectService.ts..."
    
    # Sauvegarder l'ancien fichier
    cp "$FRONTEND_DIR/src/services/projectService.ts" "$FRONTEND_DIR/src/services/projectService.ts.backup"
    
    # Mettre à jour l'URL du backend
    sed -i '' "s|https://scout-interest-optimized-[^/]*\.vercel\.app|$NEW_BACKEND_URL|g" "$FRONTEND_DIR/src/services/projectService.ts"
    
    echo "✅ projectService.ts mis à jour"
fi

if [ -f "$FRONTEND_DIR/src/services/uploadService.ts" ]; then
    echo "📝 Mise à jour de uploadService.ts..."
    
    # Sauvegarder l'ancien fichier
    cp "$FRONTEND_DIR/src/services/uploadService.ts" "$FRONTEND_DIR/src/services/uploadService.ts.backup"
    
    # Mettre à jour l'URL du backend
    sed -i '' "s|https://scout-interest-optimized-[^/]*\.vercel\.app|$NEW_BACKEND_URL|g" "$FRONTEND_DIR/src/services/uploadService.ts"
    
    echo "✅ uploadService.ts mis à jour"
fi

echo ""
echo "🔨 Rebuild du frontend..."
cd "$FRONTEND_DIR"

if npm run build; then
    echo "✅ Build réussi !"
else
    echo "❌ Build échoué !"
    exit 1
fi

echo ""
echo "🚀 Redéploiement du frontend..."
if vercel --prod --yes; then
    echo "🎉 Frontend redéployé avec succès !"
else
    echo "❌ Déploiement échoué !"
    exit 1
fi

cd ..

echo ""
echo "🎯 Configuration Frontend mise à jour !"
echo "🔄 Nouvelle URL Backend: $NEW_BACKEND_URL"
echo "📱 Testez maintenant votre application !"

