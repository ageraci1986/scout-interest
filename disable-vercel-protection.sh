#!/bin/bash
# 🚫 Désactivation Automatique de la Protection Vercel
# Script pour désactiver la protection de déploiement

set -e

echo "🚫 Désactivation de la Protection Vercel Frontend..."

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    exit 1
fi

# Vérifier l'authentification Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Non authentifié sur Vercel. Connexion..."
    vercel login
fi

echo "🔍 Vérification des projets Vercel..."
vercel ls

echo ""
echo "🎯 Pour désactiver la protection Vercel :"
echo ""
echo "1. 🌐 Aller sur : https://vercel.com/angelo-geracis-projects/frontend"
echo "2. ⚙️  Cliquer sur : 'Settings' → 'General'"
echo "3. 🚫 Désactiver : 'Deployment Protection'"
echo "4. ✅ Confirmer : La désactivation"
echo ""
echo "🔗 Ou utiliser l'URL directe :"
echo "https://vercel.com/angelo-geracis-projects/frontend/settings/general"
echo ""
echo "📱 Après désactivation, testez :"
echo "curl -s -I 'https://frontend-l10yt3idq-angelo-geracis-projects.vercel.app'"
echo ""
echo "🎯 Résultat attendu : HTTP/2 200 (au lieu de 401)"

