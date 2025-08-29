const axios = require('axios');
const { getEnvironmentConfig, estimateProcessingTime, handleRateLimitError } = require('./src/config/rateLimits');

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

// Test des différentes configurations d'environnement
async function testEnvironmentConfigs() {
  console.log('🧪 Testing Environment Configurations');
  console.log('=====================================\n');

  const environments = ['development', 'production', 'aggressive', 'conservative'];

  for (const env of environments) {
    console.log(`📊 Environment: ${env}`);
    const config = getEnvironmentConfig(env);
    
    console.log(`   Tier: ${config.tier}`);
    console.log(`   Max Score: ${config.maxScore}`);
    console.log(`   Decay Rate: ${config.decayRate}s`);
    console.log(`   Reach Estimate:`);
    console.log(`     - Calls/min: ${config.reachEstimate.callsPerMinute}`);
    console.log(`     - Calls/hour: ${config.reachEstimate.callsPerHour.toLocaleString()}`);
    console.log(`     - Max concurrent: ${config.reachEstimate.maxConcurrent}`);
    console.log(`     - Min time between calls: ${config.reachEstimate.minTimeBetweenCalls}ms`);
    console.log(`   Search:`);
    console.log(`     - Calls/min: ${config.search.callsPerMinute}`);
    console.log(`     - Calls/hour: ${config.search.callsPerHour.toLocaleString()}`);
    console.log(`     - Max concurrent: ${config.search.maxConcurrent}`);
    console.log(`     - Min time between calls: ${config.search.minTimeBetweenCalls}ms`);
    console.log('');
  }
}

// Test des estimations de temps de traitement
async function testProcessingEstimates() {
  console.log('⏱️ Testing Processing Time Estimates');
  console.log('====================================\n');

  const testCases = [10, 50, 100, 500, 1000, 5000];
  const environments = ['development', 'production', 'aggressive', 'conservative'];

  for (const env of environments) {
    console.log(`📊 Environment: ${env}`);
    
    for (const codes of testCases) {
      const estimation = estimateProcessingTime(env, codes);
      console.log(`   ${codes} codes: ~${estimation.estimatedMinutes}min (${estimation.batches} batches, ${estimation.batchSize} codes/batch)`);
    }
    console.log('');
  }
}

// Test des erreurs de rate limiting
async function testRateLimitErrorHandling() {
  console.log('🚨 Testing Rate Limit Error Handling');
  console.log('====================================\n');

  const testErrors = [
    { code: 17, error_subcode: 2446079, message: 'User request limit reached' },
    { code: 613, error_subcode: 1487742, message: 'Too many calls from this ad-account' },
    { code: 4, error_subcode: 1504022, message: 'Too many calls from this app' },
    { code: 80000, message: 'Business use case rate limit exceeded' },
    { code: 999, message: 'Unknown error' }
  ];

  for (const error of testErrors) {
    const result = handleRateLimitError(error, 'production');
    console.log(`Error ${error.code}${error.error_subcode ? ` (${error.error_subcode})` : ''}:`);
    console.log(`   Type: ${result.type}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Wait Time: ${result.waitTime}s`);
    console.log(`   Action: ${result.action}`);
    console.log('');
  }
}

// Test de performance avec les vraies limitations
async function testPerformanceWithRealLimits() {
  console.log('⚡ Testing Performance with Real Meta API Limits');
  console.log('===============================================\n');

  const testCases = [
    { codes: 10, environment: 'development' },
    { codes: 50, environment: 'production' },
    { codes: 100, environment: 'aggressive' },
    { codes: 500, environment: 'conservative' }
  ];

  for (const testCase of testCases) {
    const estimation = estimateProcessingTime(testCase.environment, testCase.codes);
    const config = getEnvironmentConfig(testCase.environment);
    
    console.log(`📊 ${testCase.codes} codes in ${testCase.environment} environment:`);
    console.log(`   Estimated time: ${estimation.estimatedMinutes} minutes`);
    console.log(`   Batches: ${estimation.batches}`);
    console.log(`   Batch size: ${estimation.batchSize}`);
    console.log(`   Rate limit: ${config.reachEstimate.callsPerHour.toLocaleString()}/hour`);
    console.log(`   Concurrent: ${config.reachEstimate.maxConcurrent}`);
    console.log(`   Time between calls: ${config.reachEstimate.minTimeBetweenCalls}ms`);
    console.log('');
  }
}

// Test de validation des configurations
async function testConfigValidation() {
  console.log('✅ Testing Configuration Validation');
  console.log('==================================\n');

  const { validateRateLimitConfig } = require('./src/config/rateLimits');

  // Test avec une config valide
  const validConfig = {
    tier: 'standard',
    maxScore: 9000,
    reachEstimate: { callsPerHour: 90000 },
    search: { callsPerHour: 90000 }
  };

  const validResult = validateRateLimitConfig(validConfig);
  console.log('Valid config:', validResult.isValid ? '✅ PASS' : '❌ FAIL');
  if (validResult.errors.length > 0) {
    console.log('Errors:', validResult.errors);
  }

  // Test avec une config invalide (dépasse les limites)
  const invalidConfig = {
    tier: 'development',
    maxScore: 100,
    reachEstimate: { callsPerHour: 500 },
    search: { callsPerHour: 500 }
  };

  const invalidResult = validateRateLimitConfig(invalidConfig);
  console.log('Invalid config:', invalidResult.isValid ? '✅ PASS' : '❌ FAIL');
  if (invalidResult.errors.length > 0) {
    console.log('Errors:', invalidResult.errors);
  }
  console.log('');
}

// Test de l'API backend
async function testBackendAPI() {
  console.log('🔌 Testing Backend API');
  console.log('======================\n');

  try {
    // Test de la configuration des rate limits
    const configResponse = await axios.get('http://localhost:3001/api/meta/rate-limits/config');
    console.log('✅ Rate limits config API:', configResponse.data.success ? 'WORKING' : 'FAILED');
    
    if (configResponse.data.success) {
      const config = configResponse.data.data;
      console.log(`   Current environment: ${config.currentEnvironment}`);
      console.log(`   Available environments: ${Object.keys(config.availableEnvironments).join(', ')}`);
    }

    // Test de l'estimation
    const estimateResponse = await axios.post('http://localhost:3001/api/meta/rate-limits/estimate', {
      totalCodes: 100,
      environment: 'production'
    });
    console.log('✅ Processing time estimation API:', estimateResponse.data.success ? 'WORKING' : 'FAILED');

  } catch (error) {
    console.log('❌ Backend API test failed:', error.message);
  }
  console.log('');
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 Starting Rate Limits Testing Suite');
  console.log('=====================================\n');

  await testEnvironmentConfigs();
  await testProcessingEstimates();
  await testRateLimitErrorHandling();
  await testPerformanceWithRealLimits();
  await testConfigValidation();
  await testBackendAPI();

  console.log('🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Development tier: Très conservateur (300 appels/heure)');
  console.log('- Standard tier: Production optimisé (90k appels/heure)');
  console.log('- Gestion d\'erreurs: Basée sur la documentation Meta officielle');
  console.log('- Batch processing: Optimisé selon les vraies limitations');
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

// Exécution principale
async function main() {
  const backendAvailable = await checkBackend();
  if (!backendAvailable) {
    process.exit(1);
  }
  
  await runAllTests();
}

main().catch(console.error);


