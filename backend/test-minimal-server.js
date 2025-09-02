const axios = require('axios');

async function testMinimalServer() {
  console.log('🧪 Testing minimal server deployment...');
  
  const baseURL = 'https://scout-interest-gf0w5xymb-angelo-geracis-projects.vercel.app';
  
  try {
    // Test 1: Health check
    console.log('\n📋 Test 1: Health check...');
    try {
      const healthResponse = await axios.get(`${baseURL}/api/health`);
      console.log('✅ Health check successful:', healthResponse.status, healthResponse.data);
    } catch (error) {
      console.error('❌ Health check failed:', error.response?.status, error.response?.data);
      console.log('💡 This means the minimal server is still crashing.');
      return;
    }
    
    // Test 2: Test endpoint
    console.log('\n📋 Test 2: Test endpoint...');
    try {
      const testResponse = await axios.get(`${baseURL}/api/test`);
      console.log('✅ Test endpoint successful:', testResponse.status, testResponse.data);
    } catch (error) {
      console.error('❌ Test endpoint failed:', error.response?.status, error.response?.data);
      console.error('❌ Error details:', error.message);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Overall test failed:', error.message);
  }
}

// Exécuter le test
testMinimalServer().catch(console.error);
