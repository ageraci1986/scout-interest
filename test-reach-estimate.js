// Test script pour vérifier le reach estimate (taille d'audience)
const axios = require('axios');

async function testReachEstimate() {
  console.log('🎯 Test du Reach Estimate (Taille d\'Audience)...\n');

  try {
    // Test 1: Reach estimate simple (US, 18-65)
    console.log('1️⃣ Test reach estimate simple (US, 18-65)...');
    const simpleResponse = await axios.post('http://localhost:3001/api/meta/reach-estimate', {
      adAccountId: 'act_379481728925498',
      targetingSpec: {
        geo_locations: [{ countries: ['US'] }],
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Reach estimate simple:', simpleResponse.data.data);

    // Test 2: Reach estimate avec intérêt (Football + US)
    console.log('\n2️⃣ Test reach estimate avec intérêt (Football + US)...');
    const interestResponse = await axios.post('http://localhost:3001/api/meta/reach-estimate', {
      adAccountId: 'act_379481728925498',
      targetingSpec: {
        interests: [{ id: '6003107902433', name: 'Football' }],
        geo_locations: [{ countries: ['US'] }],
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Reach estimate avec intérêt:', interestResponse.data.data);

    // Test 3: Reach estimate avec intérêt (Fitness + US)
    console.log('\n3️⃣ Test reach estimate avec intérêt (Fitness + US)...');
    const fitnessResponse = await axios.post('http://localhost:3001/api/meta/reach-estimate', {
      adAccountId: 'act_379481728925498',
      targetingSpec: {
        interests: [{ id: '6003384248805', name: 'Fitness and wellness' }],
        geo_locations: [{ countries: ['US'] }],
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Reach estimate Fitness:', fitnessResponse.data.data);

    // Test 4: Reach estimate France
    console.log('\n4️⃣ Test reach estimate France...');
    const franceResponse = await axios.post('http://localhost:3001/api/meta/reach-estimate', {
      adAccountId: 'act_379481728925498',
      targetingSpec: {
        geo_locations: [{ countries: ['FR'] }],
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Reach estimate France:', franceResponse.data.data);

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📊 Résumé des estimations d\'audience :');
    console.log(`- US général (18-65): ${simpleResponse.data.data.users_lower_bound.toLocaleString()} - ${simpleResponse.data.data.users_upper_bound.toLocaleString()}`);
    console.log(`- Football + US: ${interestResponse.data.data.users_lower_bound.toLocaleString()} - ${interestResponse.data.data.users_upper_bound.toLocaleString()}`);
    console.log(`- Fitness + US: ${fitnessResponse.data.data.users_lower_bound.toLocaleString()} - ${fitnessResponse.data.data.users_upper_bound.toLocaleString()}`);
    console.log(`- France général (18-65): ${franceResponse.data.data.users_lower_bound.toLocaleString()} - ${franceResponse.data.data.users_upper_bound.toLocaleString()}`);

    console.log('\n🚀 L\'application est prête !');
    console.log('1. Backend: http://localhost:3001 ✅');
    console.log('2. Reach Estimate API: ✅');
    console.log('3. Frontend: http://localhost:3000 (en cours de démarrage)');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Ouvrir http://localhost:3000 dans votre navigateur');
    console.log('2. Aller à la page "Targeting"');
    console.log('3. Rechercher des intérêts et voir les vraies estimations d\'audience Facebook !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testReachEstimate();
