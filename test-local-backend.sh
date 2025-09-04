#!/bin/bash
# 🧪 Test Local Backend - Scout Interest
set -e
echo "🧪 Test Local Backend..."

BACKEND_DIR="backend"
PORT=3001

echo "🔧 Vérification des dépendances..."
cd "$BACKEND_DIR"
if ! npm list > /dev/null 2>&1; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo "🚀 Démarrage du serveur local sur le port $PORT..."
echo "📝 Utilisation de server-vercel.js pour la compatibilité..."

# Démarrer le serveur en arrière-plan
node src/server-vercel.js &
SERVER_PID=$!

echo "⏳ Attente du démarrage du serveur..."
sleep 5

echo "🔍 Test de l'API locale..."
if response=$(curl -s "http://localhost:$PORT/api/health" 2>/dev/null); then
    echo "✅ API Health: $response"
else
    echo "❌ API Health: Échec"
fi

echo "🔍 Test de l'API Projects..."
if response=$(curl -s "http://localhost:$PORT/api/projects/user/anonymous" 2>/dev/null); then
    echo "✅ API Projects: $response"
else
    echo "❌ API Projects: Échec"
fi

echo "🔍 Test de l'API Upload..."
if response=$(curl -s "http://localhost:$PORT/api/upload/validate" -X POST -H "Content-Type: application/json" -d '{"test": true}' 2>/dev/null); then
    echo "✅ API Upload: $response"
else
    echo "❌ API Upload: Échec"
fi

echo "🛑 Arrêt du serveur local..."
kill $SERVER_PID 2>/dev/null || true

echo "🎯 Test local terminé !"
echo "📱 Si tous les tests passent, le backend est prêt pour le déploiement !"

