const axios = require('axios');

async function testDBServer() {
  console.log('🧪 Testing DB server deployment...');
  
  const baseURL = 'https://scout-interest-hoeyedktl-angelo-geracis-projects.vercel.app';
  
  try {
    // Test 1: Health check avec DB
    console.log('\n📋 Test 1: Health check with DB...');
    try {
      const healthResponse = await axios.get(`${baseURL}/api/health`);
      console.log('✅ Health check successful:', healthResponse.status, healthResponse.data);
      
      if (healthResponse.data.database === 'connected') {
        console.log('🎉 Database connection successful!');
      } else {
        console.log('⚠️  Database connection failed');
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error.response?.status, error.response?.data);
      console.log('💡 This means the DB server is crashing.');
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
testDBServer().catch(console.error);
