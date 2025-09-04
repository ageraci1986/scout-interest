#!/bin/bash
# 🧪 Test Environnement Vercel - Scout Interest
set -e
echo "🧪 Test Environnement Vercel..."

echo "🔍 Vérification des variables d'environnement Vercel..."
vercel env ls | grep -E "(DATABASE|SUPABASE|META|JWT)"

echo "🔍 Test de l'API Vercel actuelle..."
BASE_URL="https://scout-interest-optimized-cvnnttzsy-angelo-geracis-projects.vercel.app"

echo "🔍 Test 1: API Health..."
if response=$(curl -s "$BASE_URL/api/health" 2>/dev/null); then
    echo "✅ API Health: $response"
else
    echo "❌ API Health: Échec"
fi

echo "🔍 Test 2: API Projects..."
if response=$(curl -s "$BASE_URL/api/projects/user/anonymous" 2>/dev/null); then
    echo "✅ API Projects: $response"
else
    echo "❌ API Projects: Échec"
fi

echo "🔍 Test 3: API Upload (sans fichier)..."
if response=$(curl -s "$BASE_URL/api/upload/validate" -X POST -H "Content-Type: application/json" -d '{"test": true}' 2>/dev/null); then
    echo "✅ API Upload: $response"
else
    echo "❌ API Upload: Échec"
fi

echo "🔍 Test 4: API Upload JSON..."
if response=$(curl -s "$BASE_URL/api/upload/file/json" -X POST -H "Content-Type: application/json" -d '{"filename": "test.csv", "postalCodes": ["12345", "67890"]}' 2>/dev/null); then
    echo "✅ API Upload JSON: $response"
else
    echo "❌ API Upload JSON: Échec"
fi

echo "🎯 Résumé des Tests:"
echo "📱 Si tous les tests passent, le backend est prêt !"
echo "🔗 URL de test: $BASE_URL"

