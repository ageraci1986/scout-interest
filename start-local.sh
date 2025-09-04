#!/bin/bash

echo "🚀 Démarrage de l'application Scout Interest en local..."

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Créer le dossier node_modules s'il n'existe pas
echo "📦 Vérification des dépendances..."

# Backend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installation des dépendances backend..."
    cd backend
    npm install
    cd ..
else
    echo "✅ Dépendances backend déjà installées"
fi

# Frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installation des dépendances frontend..."
    cd frontend
    npm install
    cd ..
else
    echo "✅ Dépendances frontend déjà installées"
fi

# Configuration des variables d'environnement
echo "🔧 Configuration des variables d'environnement..."

# Backend
export SUPABASE_URL="https://scout-interest-optimized-a9fxapxv5-angelo-geracis-projects.vercel.app"
export SUPABASE_ANON_KEY="your-anon-key"
export NODE_ENV="development"
export PORT=3001

# Démarrer le backend en arrière-plan
echo "🔧 Démarrage du backend sur le port 3001..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
echo "⏳ Attente du démarrage du backend..."
sleep 5

# Vérifier que le backend fonctionne
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend démarré avec succès sur http://localhost:3001"
else
    echo "⚠️ Backend en cours de démarrage, continuons..."
fi

# Démarrer le frontend
echo "🌐 Démarrage du frontend sur le port 3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Application démarrée !"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "💡 Pour arrêter l'application, appuyez sur Ctrl+C"
echo ""

# Fonction de nettoyage
cleanup() {
    echo ""
    echo "🛑 Arrêt de l'application..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Application arrêtée"
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Attendre que les processus se terminent
wait
