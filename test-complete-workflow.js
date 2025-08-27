// Test script pour le workflow complet
const axios = require('axios');

async function testCompleteWorkflow() {
  console.log('🎯 Test du workflow complet...\n');

  try {
    // Test 1: Vérifier que le backend fonctionne
    console.log('1️⃣ Test du backend...');
    const backendHealth = await axios.get('http://localhost:3001/api/meta/ad-account');
    console.log('✅ Backend OK:', backendHealth.data.data);

    // Test 2: Récupérer les codes postaux du projet
    console.log('\n2️⃣ Test récupération codes postaux du projet...');
    const projectResponse = await axios.get('http://localhost:3001/api/meta/project/1/postal-codes');
    console.log('✅ Codes postaux du projet:', {
      total: projectResponse.data.data.total,
      codes: projectResponse.data.data.postalCodes.map(pc => pc.postal_code)
    });

    // Test 3: Test reach estimate pour un code postal US
    console.log('\n3️⃣ Test reach estimate code postal US...');
    const usResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate-v2', {
      adAccountId: 'act_379481728925498',
      postalCode: '10001',
      targetingSpec: {
        country_code: 'US',
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Reach estimate US:', {
      postalCode: usResponse.data.data.postalCode,
      audience: `${usResponse.data.data.reachEstimate.users_lower_bound?.toLocaleString()} - ${usResponse.data.data.reachEstimate.users_upper_bound?.toLocaleString()}`
    });

    // Test 4: Test reach estimate pour un code postal FR
    console.log('\n4️⃣ Test reach estimate code postal FR...');
    const frResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate-v2', {
      adAccountId: 'act_379481728925498',
      postalCode: '75001',
      targetingSpec: {
        country_code: 'FR',
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Reach estimate FR:', {
      postalCode: frResponse.data.data.postalCode,
      audience: `${frResponse.data.data.reachEstimate.users_lower_bound?.toLocaleString()} - ${frResponse.data.data.reachEstimate.users_upper_bound?.toLocaleString()}`
    });

    // Test 5: Test reach estimate avec targeting (sans géoloc)
    console.log('\n5️⃣ Test reach estimate avec targeting (sans géoloc)...');
    const targetingResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate-v2', {
      adAccountId: 'act_379481728925498',
      postalCode: '10001',
      targetingSpec: {
        country_code: 'US',
        age_min: 25,
        age_max: 45,
        genders: ['1'], // Hommes seulement
        device_platforms: ['mobile']
      }
    });
    console.log('✅ Reach estimate avec targeting:', {
      postalCode: targetingResponse.data.data.postalCode,
      audience: `${targetingResponse.data.data.reachEstimate.users_lower_bound?.toLocaleString()} - ${targetingResponse.data.data.reachEstimate.users_upper_bound?.toLocaleString()}`
    });

    console.log('\n🎉 Tous les tests du workflow sont passés avec succès !');
    console.log('\n📋 Résumé du workflow :');
    console.log('1. ✅ Backend opérationnel');
    console.log('2. ✅ Récupération codes postaux du projet');
    console.log('3. ✅ Reach estimate code postal seul (US)');
    console.log('4. ✅ Reach estimate code postal seul (FR)');
    console.log('5. ✅ Reach estimate avec targeting (sans géoloc)');

    console.log('\n🚀 Le workflow complet est fonctionnel !');
    console.log('\n📖 Prochaines étapes :');
    console.log('1. Tester l\'interface utilisateur complète');
    console.log('2. Intégrer avec les vrais fichiers uploadés');
    console.log('3. Optimiser les performances pour de gros volumes');
    console.log('4. Ajouter la gestion d\'erreurs avancée');

  } catch (error) {
    console.error('❌ Erreur lors du test du workflow:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testCompleteWorkflow();
