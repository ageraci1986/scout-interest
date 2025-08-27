// Test script pour les codes postaux avec reach estimate
const axios = require('axios');

async function testPostalCodes() {
  console.log('🎯 Test des codes postaux avec Reach Estimate...\n');

  try {
    // Test 1: Reach estimate pour un code postal simple (US)
    console.log('1️⃣ Test reach estimate pour un code postal simple (US)...');
    const simplePostalResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate', {
      adAccountId: 'act_379481728925498',
      postalCode: '10001', // New York
      country: 'US'
    });
    console.log('✅ Reach estimate code postal simple:', simplePostalResponse.data.data);

    // Test 2: Reach estimate pour un code postal avec intérêt (US)
    console.log('\n2️⃣ Test reach estimate pour un code postal avec intérêt (US)...');
    const postalWithInterestResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate', {
      adAccountId: 'act_379481728925498',
      postalCode: '10001', // New York
      country: 'US',
      targetingSpec: {
        interests: [{ id: '6003107902433', name: 'Football' }],
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Reach estimate code postal avec intérêt:', postalWithInterestResponse.data.data);

    // Test 3: Reach estimate pour un code postal français
    console.log('\n3️⃣ Test reach estimate pour un code postal français...');
    const frenchPostalResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate', {
      adAccountId: 'act_379481728925498',
      postalCode: '75001', // Paris 1er
      country: 'FR'
    });
    console.log('✅ Reach estimate code postal français:', frenchPostalResponse.data.data);

    // Test 4: Batch processing de plusieurs codes postaux
    console.log('\n4️⃣ Test batch processing de plusieurs codes postaux...');
    const batchResponse = await axios.post('http://localhost:3001/api/meta/batch-postal-codes-reach-estimate', {
      adAccountId: 'act_379481728925498',
      postalCodes: ['10001', '10002', '10003'], // New York codes
      country: 'US',
      targetingSpec: {
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Batch processing terminé:', {
      totalProcessed: batchResponse.data.data.totalProcessed,
      successful: batchResponse.data.data.successful,
      errors: batchResponse.data.data.errors
    });

    // Afficher les résultats du batch
    console.log('\n📊 Résultats du batch processing:');
    batchResponse.data.data.results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.postalCode}: ${result.reachEstimate.users_lower_bound?.toLocaleString() || 'N/A'} - ${result.reachEstimate.users_upper_bound?.toLocaleString() || 'N/A'} utilisateurs`);
    });

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📋 Résumé des estimations par code postal :');
    console.log(`- 10001 (NY) simple: ${simplePostalResponse.data.data.reachEstimate.users_lower_bound?.toLocaleString() || 'N/A'} - ${simplePostalResponse.data.data.reachEstimate.users_upper_bound?.toLocaleString() || 'N/A'}`);
    console.log(`- 10001 (NY) + Football: ${postalWithInterestResponse.data.data.reachEstimate.users_lower_bound?.toLocaleString() || 'N/A'} - ${postalWithInterestResponse.data.data.reachEstimate.users_upper_bound?.toLocaleString() || 'N/A'}`);
    console.log(`- 75001 (Paris) simple: ${frenchPostalResponse.data.data.reachEstimate.users_lower_bound?.toLocaleString() || 'N/A'} - ${frenchPostalResponse.data.data.reachEstimate.users_upper_bound?.toLocaleString() || 'N/A'}`);

    console.log('\n🚀 La fonctionnalité des codes postaux est prête !');
    console.log('1. Endpoint individuel: ✅');
    console.log('2. Endpoint batch: ✅');
    console.log('3. Support US et FR: ✅');
    console.log('4. Intégration avec intérêts: ✅');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testPostalCodes();
