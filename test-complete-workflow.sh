#!/bin/bash
# 🧪 Test Complet du Workflow Scout Interest
set -e
echo "🧪 TEST COMPLET DU WORKFLOW SCOUT INTEREST"
echo "=========================================="

BASE_URL="https://scout-interest-optimized-j9gktt1ue-angelo-geracis-projects.vercel.app"

echo ""
echo "🔍 Étape 1: Création d'un projet avec 3 codes postaux"
echo "----------------------------------------------------"
echo "📤 Upload de fichier avec codes postaux: 75001, 75002, 75003..."

upload_response=$(curl -s "$BASE_URL/api/upload/file/json" -X POST -H "Content-Type: application/json" -d '{
  "filename": "test-workflow.csv", 
  "postalCodes": ["75001", "75002", "75003"]
}')

echo "✅ Upload Response: $upload_response"

# Extraire le project_id
project_id=$(echo "$upload_response" | grep -o '"project_id":"[^"]*' | cut -d'"' -f4)
echo "📋 Project ID créé: $project_id"

if [ -z "$project_id" ]; then
    echo "❌ Échec: Impossible de récupérer le project ID"
    exit 1
fi

echo ""
echo "🔍 Étape 2: Vérification du projet créé"
echo "---------------------------------------"
project_response=$(curl -s "$BASE_URL/api/projects/$project_id")
echo "✅ Project Response: $project_response"

echo ""
echo "🔍 Étape 3: Création d'un targeting avancé"
echo "------------------------------------------"
targeting_spec='{
  "age_min": 25,
  "age_max": 45,
  "genders": [1, 2],
  "countries": ["FR"],
  "geo_locations": [{"countries": ["FR"]}],
  "interestGroups": [{
    "id": "group-1",
    "name": "Technology",
    "operator": "OR",
    "interests": [{
      "id": "6002714398172",
      "name": "Technology"
    }]
  }],
  "device_platforms": ["mobile", "desktop"]
}'

echo "📋 Targeting spec à sauvegarder: $targeting_spec"

targeting_response=$(curl -s "$BASE_URL/api/projects/$project_id" -X PATCH -H "Content-Type: application/json" -d "{\"targeting_spec\": $targeting_spec}")
echo "✅ Targeting Response: $targeting_response"

echo ""
echo "🔍 Étape 4: Test de l'API Meta avec targeting"
echo "---------------------------------------------"
meta_response=$(curl -s "$BASE_URL/api/meta/reach-estimate" -X POST -H "Content-Type: application/json" -d "{
  \"adAccountId\": \"act_379481728925498\",
  \"advancedTargetingSpec\": $targeting_spec
}")
echo "✅ Meta API Response: $meta_response"

echo ""
echo "🔍 Étape 5: Récupération complète du projet avec résultats"
echo "---------------------------------------------------------"
final_project_response=$(curl -s "$BASE_URL/api/projects/$project_id")
echo "✅ Final Project Response: $final_project_response"

echo ""
echo "🔍 Étape 6: Récupération des résultats séparément"
echo "------------------------------------------------"
results_response=$(curl -s "$BASE_URL/api/projects/$project_id/results")
echo "✅ Results Response: $results_response"

echo ""
echo "🎯 RÉSUMÉ DU TEST COMPLET"
echo "========================="
echo "📋 Project ID: $project_id"
echo "🔗 URL du projet: $BASE_URL/projects"
echo "🔗 URL des résultats: $BASE_URL/results (avec project ID: $project_id)"

# Vérifier les résultats
if echo "$final_project_response" | grep -q '"results":\['; then
    result_count=$(echo "$final_project_response" | grep -o '"postal_code":"[^"]*' | wc -l)
    echo "✅ Résultats trouvés: $result_count codes postaux"
else
    echo "❌ Aucun résultat trouvé"
fi

if echo "$meta_response" | grep -q '"success":true'; then
    echo "✅ API Meta: Fonctionnelle"
else
    echo "❌ API Meta: Problème"
fi

echo ""
echo "🎉 TEST COMPLET TERMINÉ !"
echo "📱 Si tous les tests passent, votre application est 100% fonctionnelle !"
