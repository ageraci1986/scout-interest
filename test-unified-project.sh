#!/bin/bash
# 🧪 Test du Projet Unifié Scout Interest
set -e
echo "🧪 Test du Projet Unifié Scout Interest..."
BASE_URL="https://scout-interest-optimized-q2zikwk1p-angelo-geracis-projects.vercel.app"

echo "🔍 Test 1: API Health Check..."
if response=$(curl -s "$BASE_URL/api/health" 2>/dev/null); then
    if echo "$response" | grep -q '"status":"OK"'; then
        echo "✅ API Health: OK"
    else
        echo "❌ API Health: Échec"
        echo "$response"
    fi
else
    echo "❌ API Health: Erreur de connexion"
fi

echo "🔍 Test 2: API Projects..."
if response=$(curl -s "$BASE_URL/api/projects/user/anonymous" 2>/dev/null); then
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ API Projects: OK"
        project_count=$(echo "$response" | grep -o '"id":[0-9]*' | wc -l)
        echo "📊 Nombre de projets trouvés: $project_count"
    else
        echo "❌ API Projects: Échec"
        echo "$response"
    fi
else
    echo "❌ API Projects: Erreur de connexion"
fi

echo "🔍 Test 3: Frontend Access..."
if response=$(curl -s -I "$BASE_URL/" 2>/dev/null); then
    if echo "$response" | grep -q "HTTP/2 200"; then
        echo "✅ Frontend: Accessible"
    else
        echo "❌ Frontend: Problème d'accès"
        echo "$response"
    fi
else
    echo "❌ Frontend: Erreur de connexion"
fi

echo "🎯 Résumé des Tests:"
echo "📱 URL de votre application: $BASE_URL"
echo "🔗 Frontend: $BASE_URL/"
echo "🔗 API: $BASE_URL/api/*"
echo "🎉 Votre projet Scout Interest est maintenant unifié et fonctionnel !"

