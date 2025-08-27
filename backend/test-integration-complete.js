// Test script pour l'intégration complète frontend/backend
const axios = require('axios');

async function testIntegrationComplete() {
  console.log('🎯 Test de l\'intégration complète frontend/backend...\n');

  try {
    // Test 1: Vérifier que le backend fonctionne
    console.log('1️⃣ Test du backend...');
    const backendHealth = await axios.get('http://localhost:3001/api/meta/ad-account');
    console.log('✅ Backend OK:', backendHealth.data.data);

    // Test 2: Test de recherche de codes postaux
    console.log('\n2️⃣ Test de recherche de codes postaux...');
    const searchResponse = await axios.get('http://localhost:3001/api/meta/search-postal-codes', {
      params: {
        q: '10001',
        country_code: 'US',
        limit: 3
      }
    });
    console.log('✅ Recherche codes postaux OK:', {
      query: searchResponse.data.data.query,
      results: searchResponse.data.data.results.length
    });

    // Test 3: Test reach estimate pour un code postal
    console.log('\n3️⃣ Test reach estimate pour un code postal...');
    const reachResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate-v2', {
      adAccountId: 'act_379481728925498',
      postalCode: '10001',
      targetingSpec: {
        country_code: 'US',
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Reach estimate OK:', {
      postalCode: reachResponse.data.data.postalCode,
      audience: `${reachResponse.data.data.reachEstimate.users_lower_bound?.toLocaleString()} - ${reachResponse.data.data.reachEstimate.users_upper_bound?.toLocaleString()}`
    });

    // Test 4: Test batch processing
    console.log('\n4️⃣ Test batch processing...');
    const batchResponse = await axios.post('http://localhost:3001/api/meta/batch-postal-codes-reach-estimate-v2', {
      adAccountId: 'act_379481728925498',
      postalCodes: ['10001', '10002'],
      targetingSpec: {
        country_code: 'US',
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Batch processing OK:', {
      totalProcessed: batchResponse.data.data.totalProcessed,
      successful: batchResponse.data.data.successful,
      errors: batchResponse.data.data.errors
    });

    // Test 5: Test avec un code postal français
    console.log('\n5️⃣ Test avec un code postal français...');
    const frenchResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate-v2', {
      adAccountId: 'act_379481728925498',
      postalCode: '75001',
      targetingSpec: {
        country_code: 'FR',
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Code postal français OK:', {
      postalCode: frenchResponse.data.data.postalCode,
      country: frenchResponse.data.data.zipCodeData.country_name,
      audience: `${frenchResponse.data.data.reachEstimate.users_lower_bound?.toLocaleString()} - ${frenchResponse.data.data.reachEstimate.users_upper_bound?.toLocaleString()}`
    });

    console.log('\n🎉 Tous les tests d\'intégration sont passés avec succès !');
    console.log('\n📋 Résumé de l\'intégration :');
    console.log('1. ✅ Backend opérationnel');
    console.log('2. ✅ Recherche de codes postaux fonctionnelle');
    console.log('3. ✅ Reach estimate individuel opérationnel');
    console.log('4. ✅ Batch processing opérationnel');
    console.log('5. ✅ Support multi-pays confirmé');

    console.log('\n🚀 L\'intégration est complète et fonctionnelle !');
    console.log('\n📖 Prochaines étapes :');
    console.log('1. Tester l\'interface utilisateur sur http://localhost:3000');
    console.log('2. Tester avec vos codes postaux uploadés');
    console.log('3. Ajouter le support des intérêts combinés');
    console.log('4. Optimiser les performances pour de gros volumes');

  } catch (error) {
    console.error('❌ Erreur lors du test d\'intégration:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testIntegrationComplete();
