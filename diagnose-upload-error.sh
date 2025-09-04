#!/bin/bash
# 🔍 Diagnostic Erreur Upload - Scout Interest
set -e
echo "🔍 Diagnostic Erreur Upload..."

BASE_URL="https://scout-interest-optimized-82jsczd46-angelo-geracis-projects.vercel.app"

echo "🔍 Test 1: API Upload Endpoint..."
if response=$(curl -s "$BASE_URL/api/upload/validate" -X POST -H "Content-Type: application/json" -d '{"test": true}' 2>/dev/null); then
    echo "✅ API Upload accessible: $response"
else
    echo "❌ API Upload inaccessible"
fi

echo "🔍 Test 2: Vérification des Variables d'Environnement..."
if response=$(curl -s "$BASE_URL/api/health" 2>/dev/null); then
    echo "✅ Health Check: $response"
else
    echo "❌ Health Check échoué"
fi

echo "🔍 Test 3: Test Upload Simple..."
if response=$(curl -s "$BASE_URL/api/upload/file/json" -X POST -H "Content-Type: application/json" -d '{"test": "data"}' 2>/dev/null); then
    echo "✅ Upload Test: $response"
else
    echo "❌ Upload Test échoué"
fi

echo "🎯 Actions recommandées :"
echo "1. Vérifier les logs Vercel : https://vercel.com/angelo-geracis-projects/scout-interest-optimized"
echo "2. Vérifier les variables d'environnement"
echo "3. Tester avec un fichier plus petit"
echo "4. Vérifier la configuration de la base de données"

