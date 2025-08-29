const axios = require('axios');

// Configuration de test
const TEST_CONFIG = {
  adAccountId: 'act_379481728925498',
  countryCode: 'US',
  targetingSpec: {
    age_min: 18,
    age_max: 65,
    genders: ['1', '2'],
    device_platforms: ['mobile', 'desktop']
  }
};

// Codes postaux de test (différentes tailles)
const TEST_POSTAL_CODES = {
  small: ['10001', '10002', '10003', '10004', '10005'],
  medium: ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009', '10010'],
  large: ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009', '10010', 
          '10011', '10012', '10013', '10014', '10015', '10016', '10017', '10018', '10019', '10020']
};

async function testSequentialProcessing(postalCodes) {
  console.log(`\n🔄 Testing SEQUENTIAL processing for ${postalCodes.length} postal codes...`);
  const startTime = Date.now();
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < postalCodes.length; i++) {
    const postalCode = postalCodes[i];
    console.log(`📦 Processing ${i + 1}/${postalCodes.length}: ${postalCode}`);
    
    try {
      const response = await axios.post('http://localhost:3001/api/meta/postal-code-reach-estimate-v2', {
        adAccountId: TEST_CONFIG.adAccountId,
        postalCode,
        targetingSpec: {
          ...TEST_CONFIG.targetingSpec,
          country_code: TEST_CONFIG.countryCode
        }
      });
      
      if (response.data.success) {
        results.push(response.data.data);
      } else {
        errors.push({ postalCode, error: 'API returned success: false' });
      }
    } catch (error) {
      errors.push({ postalCode, error: error.message });
    }
    
    // Pause entre les requêtes
    if (i < postalCodes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  return {
    method: 'Sequential',
    postalCodesCount: postalCodes.length,
    duration,
    successful: results.length,
    errors: errors.length,
    avgTimePerCode: duration / postalCodes.length
  };
}

async function testParallelProcessing(postalCodes) {
  console.log(`\n⚡ Testing PARALLEL processing for ${postalCodes.length} postal codes...`);
  const startTime = Date.now();
  
  try {
    const response = await axios.post('http://localhost:3001/api/meta/parallel-postal-codes-reach-estimate', {
      postalCodes,
      countryCode: TEST_CONFIG.countryCode,
      adAccountId: TEST_CONFIG.adAccountId,
      targetingSpec: TEST_CONFIG.targetingSpec
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      method: 'Parallel',
      postalCodesCount: postalCodes.length,
      duration,
      successful: response.data.data.successful,
      errors: response.data.data.errors,
      avgTimePerCode: duration / postalCodes.length,
      performance: response.data.data.performance
    };
  } catch (error) {
    console.error('❌ Error in parallel processing:', error.message);
    return {
      method: 'Parallel',
      postalCodesCount: postalCodes.length,
      duration: 0,
      successful: 0,
      errors: postalCodes.length,
      avgTimePerCode: 0,
      error: error.message
    };
  }
}

async function runPerformanceTest() {
  console.log('🚀 Starting Performance Test Suite');
  console.log('=====================================');
  
  const results = [];
  
  // Test avec différentes tailles de données
  for (const [size, postalCodes] of Object.entries(TEST_POSTAL_CODES)) {
    console.log(`\n📊 Testing ${size.toUpperCase()} dataset (${postalCodes.length} codes)`);
    
    // Test séquentiel
    const sequentialResult = await testSequentialProcessing(postalCodes);
    results.push(sequentialResult);
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test parallèle
    const parallelResult = await testParallelProcessing(postalCodes);
    results.push(parallelResult);
    
    // Pause entre les datasets
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Affichage des résultats
  console.log('\n📈 PERFORMANCE RESULTS');
  console.log('======================');
  
  results.forEach(result => {
    console.log(`\n${result.method} Processing (${result.postalCodesCount} codes):`);
    console.log(`  ⏱️  Duration: ${result.duration}ms`);
    console.log(`  ⚡ Avg time per code: ${result.avgTimePerCode.toFixed(0)}ms`);
    console.log(`  ✅ Successful: ${result.successful}`);
    console.log(`  ❌ Errors: ${result.errors}`);
    
    if (result.performance) {
      console.log(`  📊 Rate Limiter Stats:`);
      console.log(`     - Queued: ${result.performance.rateLimiterStats.queued}`);
      console.log(`     - Running: ${result.performance.rateLimiterStats.running}`);
      console.log(`     - Done: ${result.performance.rateLimiterStats.done}`);
      console.log(`     - Failed: ${result.performance.rateLimiterStats.failed}`);
    }
  });
  
  // Comparaison des performances
  console.log('\n🏆 PERFORMANCE COMPARISON');
  console.log('=========================');
  
  for (let i = 0; i < results.length; i += 2) {
    const sequential = results[i];
    const parallel = results[i + 1];
    
    if (sequential && parallel) {
      const speedup = sequential.duration / parallel.duration;
      const efficiency = (speedup / parallel.postalCodesCount) * 100;
      
      console.log(`\n${sequential.postalCodesCount} codes:`);
      console.log(`  Sequential: ${sequential.duration}ms`);
      console.log(`  Parallel:   ${parallel.duration}ms`);
      console.log(`  Speedup:    ${speedup.toFixed(2)}x faster`);
      console.log(`  Efficiency: ${efficiency.toFixed(1)}%`);
    }
  }
  
  console.log('\n🎉 Performance test completed!');
}

// Vérification que le backend est accessible
async function checkBackend() {
  try {
    const response = await axios.get('http://localhost:3001/api/meta/ad-account');
    console.log('✅ Backend is accessible');
    return true;
  } catch (error) {
    console.error('❌ Backend is not accessible. Please start the backend server first.');
    return false;
  }
}

// Exécution du test
async function main() {
  const backendAvailable = await checkBackend();
  if (!backendAvailable) {
    process.exit(1);
  }
  
  await runPerformanceTest();
}

main().catch(console.error);


