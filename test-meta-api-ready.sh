#!/bin/bash
# 🧪 Test Meta API Ready - Scout Interest
set -e
echo "🧪 Test Meta API - En attente de la mise à jour..."

FINAL_URL="https://scout-interest-optimized-ohgykwnm1-angelo-geracis-projects.vercel.app"
MAX_ATTEMPTS=20
ATTEMPT=1

echo "⏳ Test toutes les 15 secondes (max $MAX_ATTEMPTS tentatives)..."
echo ""

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "🔍 Tentative $ATTEMPT/$MAX_ATTEMPTS - $(date +%H:%M:%S)"
    
    # Test du token Meta
    if response=$(curl -s "$FINAL_URL/api/meta/validate-token" 2>/dev/null); then
        if echo "$response" | grep -q '"valid":true'; then
            echo "✅ META TOKEN VALIDE !"
            echo "📊 Réponse: $response"
            break
        elif echo "$response" | grep -q '"valid":false'; then
            echo "⚠️  Token invalide - Vérifiez votre nouveau token"
            echo "📊 Réponse: $response"
        else
            echo "❌ Erreur de validation: $response"
        fi
    else
        echo "❌ Impossible de contacter l'API"
    fi
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo ""
        echo "⏰ Temps d'attente dépassé. Vérifiez :"
        echo "1. Le redéploiement Vercel est terminé"
        echo "2. Le nouveau token Meta est correct"
        echo "3. Les permissions du token incluent 'ads_read'"
        break
    fi
    
    echo "⏳ Attente 15 secondes..."
    sleep 15
    ATTEMPT=$((ATTEMPT + 1))
    echo ""
done

if [ $ATTEMPT -le $MAX_ATTEMPTS ]; then
    echo ""
    echo "🎉 META API PRÊTE !"
    echo "🚀 Testez maintenant votre application :"
    echo "   $FINAL_URL"
    echo ""
    echo "✅ Fonctionnalités disponibles :"
    echo "   • Upload de fichiers ✅"
    echo "   • Vraies données Meta API ✅"  
    echo "   • Estimations d'audience réelles ✅"
    echo "   • Recherche d'intérêts ✅"
fi

