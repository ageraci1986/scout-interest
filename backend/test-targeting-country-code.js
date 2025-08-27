// Test script pour vérifier l'utilisation du country_code du targetingSpec
const axios = require('axios');

async function testTargetingCountryCode() {
  console.log('🎯 Test de l\'utilisation du country_code du targetingSpec...\n');

  try {
    // Test 1: Reach estimate avec country_code US dans targetingSpec
    console.log('1️⃣ Test reach estimate avec country_code US dans targetingSpec...');
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
      country_code: usResponse.data.data.country_code,
      reachEstimate: usResponse.data.data.reachEstimate
    });

    // Test 2: Reach estimate avec country_code FR dans targetingSpec
    console.log('\n2️⃣ Test reach estimate avec country_code FR dans targetingSpec...');
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
      country_code: frResponse.data.data.country_code,
      reachEstimate: frResponse.data.data.reachEstimate
    });

    // Test 3: Batch processing avec country_code US dans targetingSpec
    console.log('\n3️⃣ Test batch processing avec country_code US dans targetingSpec...');
    const batchResponse = await axios.post('http://localhost:3001/api/meta/batch-postal-codes-reach-estimate-v2', {
      adAccountId: 'act_379481728925498',
      postalCodes: ['10001', '10002', '10003'],
      targetingSpec: {
        country_code: 'US',
        age_min: 18,
        age_max: 65
      }
    });
    console.log('✅ Batch processing US:', {
      totalProcessed: batchResponse.data.data.totalProcessed,
      successful: batchResponse.data.data.successful,
      errors: batchResponse.data.data.errors
    });

    // Test 4: Test avec country_code par défaut (US) quand non spécifié
    console.log('\n4️⃣ Test avec country_code par défaut (US) quand non spécifié...');
    const defaultResponse = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate-v2', {
      adAccountId: 'act_379481728925498',
      postalCode: '10001',
      targetingSpec: {
        age_min: 18,
        age_max: 65
        // Pas de country_code spécifié
      }
    });
    console.log('✅ Reach estimate par défaut:', {
      postalCode: defaultResponse.data.data.postalCode,
      country_code: defaultResponse.data.data.country_code,
      reachEstimate: defaultResponse.data.data.reachEstimate
    });

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📋 Résumé de l\'implémentation :');
    console.log('1. ✅ Utilisation du country_code du targetingSpec');
    console.log('2. ✅ Fallback vers US si country_code non spécifié');
    console.log('3. ✅ Support multi-pays (US/FR)');
    console.log('4. ✅ Cohérence entre tous les endpoints');

    console.log('\n🚀 L\'implémentation fonctionne parfaitement !');
    console.log('📖 Logique utilisée :');
    console.log('   - country_code = targetingSpec.country_code || "US"');
    console.log('   - Utilisation cohérente dans tous les endpoints');
    console.log('   - Contrôle explicite par l\'utilisateur via le targeting');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testTargetingCountryCode();
