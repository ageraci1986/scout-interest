const ParallelProcessorFixed = require('./src/services/parallelProcessorFixed');

async function testParallelProcessorFixed() {
  console.log('🧪 Testing ParallelProcessorFixed...');
  
  const processor = new ParallelProcessorFixed();
  
  const testPostalCodes = ['75001', '75002', '75003', '75004', '75005'];
  const testCountryCode = 'US';
  const testAdAccountId = 'act_323074088483830';
  const testTargetingSpec = {
    age_min: 18,
    age_max: 65,
    genders: ['1', '2'],
    device_platforms: ['mobile', 'desktop'],
    interests: [
      {
        id: '6002714398572',
        name: 'Technology',
        audience_size: 1000000,
        path: ['Technology']
      },
      {
        id: '6002714398573',
        name: 'Business',
        audience_size: 2000000,
        path: ['Business']
      }
    ]
  };
  
  try {
    console.log('🚀 Starting test processing...');
    
    const result = await processor.processBatch(
      testPostalCodes,
      testCountryCode,
      testAdAccountId,
      testTargetingSpec,
      3 // Petit batch size pour le test
    );
    
    console.log('✅ Test completed successfully!');
    console.log('📊 Results:', {
      totalProcessed: result.totalProcessed,
      successful: result.successful,
      errors: result.errors,
      resultsCount: result.results?.length || 0
    });
    
    // Vérifier que tous les résultats ont bien les deux estimations
    if (result.results && result.results.length > 0) {
      result.results.forEach((res, index) => {
        console.log(`📋 Result ${index + 1}:`, {
          postalCode: res.postalCode,
          success: res.success,
          hasPostalCodeOnlyEstimate: !!res.postalCodeOnlyEstimate,
          hasPostalCodeWithTargetingEstimate: !!res.postalCodeWithTargetingEstimate,
          error: res.error
        });
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Exécuter le test si ce fichier est lancé directement
if (require.main === module) {
  testParallelProcessorFixed()
    .then(() => {
      console.log('🎉 All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testParallelProcessorFixed };
