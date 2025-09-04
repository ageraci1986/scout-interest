#!/bin/bash
# 🚀 Déploiement Automatique Frontend - Scout Interest Vercel
# Script pour déployer automatiquement le frontend

set -e

# Configuration
FRONTEND_DIR="frontend"
PROJECT_NAME="scout-interest-frontend"

echo "🚀 Déploiement Automatique du Frontend Scout Interest..."

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé. Installation..."
    npm install -g vercel
fi

# Vérifier l'authentification Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Non authentifié sur Vercel. Connexion..."
    vercel login
fi

# Aller dans le dossier frontend
cd "$FRONTEND_DIR"

echo "📁 Déploiement depuis: $(pwd)"

# Vérifier que le build fonctionne
echo "🔨 Test du build..."
if npm run build; then
    echo "✅ Build réussi !"
else
    echo "❌ Build échoué !"
    exit 1
fi

# Déployer sur Vercel
echo "🚀 Déploiement sur Vercel..."
if vercel --prod --yes; then
    echo "🎉 Frontend déployé avec succès !"
    
    # Récupérer l'URL de déploiement
    DEPLOY_URL=$(vercel ls | grep "$PROJECT_NAME" | head -1 | awk '{print $2}')
    if [ -n "$DEPLOY_URL" ]; then
        echo "🌐 URL de déploiement: $DEPLOY_URL"
        
        # Tester le déploiement
        echo "🧪 Test du déploiement..."
        sleep 10
        
        if curl -s -I "$DEPLOY_URL" | grep -q "200\|304"; then
            echo "✅ Frontend accessible et fonctionnel !"
        else
            echo "⚠️ Frontend déployé mais peut-être pas encore accessible"
        fi
    fi
else
    echo "❌ Déploiement échoué !"
    exit 1
fi

# Retourner au répertoire racine
cd ..

echo "🎯 Déploiement Frontend terminé !"

