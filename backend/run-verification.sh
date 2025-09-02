#!/bin/bash

echo "🔍 Vérification complète des tables Supabase..."
echo ""

# Demander la DATABASE_URL si elle n'est pas fournie
if [ -z "$DATABASE_URL" ]; then
    echo "📝 Veuillez entrer votre DATABASE_URL Supabase :"
    echo "Format: postgresql://postgres.wnugqzgzzwmebjjsfrns:VOTRE_MOT_DE_PASSE@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
    echo ""
    read -p "DATABASE_URL: " DATABASE_URL
    echo ""
fi

# Vérifier que la DATABASE_URL est fournie
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL est requise pour continuer"
    exit 1
fi

echo "🔧 Exécution du script de vérification..."
echo ""

# Exécuter le script de vérification
DATABASE_URL="$DATABASE_URL" node verify-all-tables.js

echo ""
echo "✅ Script terminé !"
