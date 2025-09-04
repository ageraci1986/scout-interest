#!/bin/bash
# 🚀 Correction Rapide CORS - Scout Interest
# Script pour résoudre rapidement le problème CORS

set -e

echo "🚀 Correction Rapide du Problème CORS..."
echo ""

# Configuration
FRONTEND_URL="https://frontend-g7xl4b1k6-angelo-geracis-projects.vercel.app"
BACKEND_URL="https://scout-interest-optimized-be1j3sm0q-angelo-geracis-projects.vercel.app"

echo "🔍 Diagnostic rapide..."
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo ""

# Test 1: Vérifier que le frontend est accessible
echo "📱 Test 1: Vérification Frontend..."
if curl -s -I "$FRONTEND_URL" | grep -q "HTTP/2 200"; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend inaccessible"
    exit 1
fi

# Test 2: Vérifier que le backend est accessible
echo "🚀 Test 2: Vérification Backend..."
if response=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null); then
    if echo "$response" | grep -q "status.*OK"; then
        echo "✅ Backend accessible"
        echo "   CORS configuré: $(echo "$response" | grep -o '"cors":"[^"]*"')"
    else
        echo "❌ Backend accessible mais réponse inattendue"
        exit 1
    fi
else
    echo "❌ Backend inaccessible"
    exit 1
fi

# Test 3: Test CORS direct
echo "🌐 Test 3: Test CORS Direct..."
if response=$(curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/projects/user/anonymous" 2>/dev/null); then
    if echo "$response" | grep -q "success.*true"; then
        echo "✅ CORS fonctionne ! Communication réussie !"
        echo "🎉 Problème résolu !"
        exit 0
    else
        echo "⚠️  CORS partiellement fonctionnel"
        echo "   Réponse: $response" | head -3
    fi
else
    echo "❌ CORS ne fonctionne pas"
fi

echo ""
echo "🔧 Actions recommandées :"
echo "1. Attendre 5-10 minutes que Vercel recharge les variables"
echo "2. Tester à nouveau l'application"
echo "3. Si le problème persiste, redéployer le backend"
echo ""
echo "📱 Test manuel :"
echo "   Ouvrir: $FRONTEND_URL"
echo "   Vérifier si les projets se chargent maintenant"
echo ""
echo "🎯 Le problème CORS devrait se résoudre automatiquement dans quelques minutes !"

