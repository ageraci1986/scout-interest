const axios = require('axios');

async function testFinalScoutInterest() {
  console.log('🧪 Testing final scout-interest deployment with security disabled...');
  
  const baseURL = 'https://scout-interest-n11wy9ayh-angelo-geracis-projects.vercel.app';
  
  try {
    // Test 1: Health check
    console.log('\n📋 Test 1: Health check...');
    try {
      const healthResponse = await axios.get(`${baseURL}/api/health`);
      console.log('✅ Health check successful:', healthResponse.status, healthResponse.data);
    } catch (error) {
      console.error('❌ Health check failed:', error.response?.status, error.response?.data);
      console.log('💡 This means protection is still active or API is crashing.');
      return;
    }
    
    // Test 2: Get user projects
    console.log('\n📋 Test 2: Get user projects...');
    try {
      const projectsResponse = await axios.get(`${baseURL}/api/projects/user/anonymous`);
      console.log('✅ Projects API successful:', projectsResponse.status);
      console.log('📊 Projects found:', projectsResponse.data.projects?.length || 0);
      
      if (projectsResponse.data.projects && projectsResponse.data.projects.length > 0) {
        const firstProject = projectsResponse.data.projects[0];
        console.log('📋 First project:', {
          id: firstProject.id,
          name: firstProject.name,
          status: firstProject.status,
          user_id: firstProject.user_id
        });
        
        // Test 3: Get project results
        console.log('\n📋 Test 3: Get project results...');
        try {
          const resultsResponse = await axios.get(`${baseURL}/api/projects/${firstProject.id}/results`);
          console.log('✅ Results API successful:', resultsResponse.status);
          console.log('📊 Results found:', resultsResponse.data.results?.length || 0);
          
          if (resultsResponse.data.results && resultsResponse.data.results.length > 0) {
            const firstResult = resultsResponse.data.results[0];
            console.log('📋 First result:', {
              id: firstResult.id,
              postal_code: firstResult.postal_code,
              country_code: firstResult.country_code,
              success: firstResult.success,
              error_message: firstResult.error_message
            });
          } else {
            console.log('⚠️  No results found for this project');
          }
          
        } catch (error) {
          console.error('❌ Results API failed:', error.response?.status, error.response?.data);
          console.error('❌ Error details:', error.message);
        }
        
        // Test 4: Get project status
        console.log('\n📋 Test 4: Get project status...');
        try {
          const statusResponse = await axios.get(`${baseURL}/api/projects/${firstProject.id}/status`);
          console.log('✅ Status API successful:', statusResponse.status);
          console.log('📊 Status data:', statusResponse.data);
        } catch (error) {
          console.error('❌ Status API failed:', error.response?.status, error.response?.data);
          console.error('❌ Error details:', error.message);
        }
        
      } else {
        console.log('⚠️  No projects found to test results');
      }
      
    } catch (error) {
      console.error('❌ Projects API failed:', error.response?.status, error.response?.data);
      console.error('❌ Error details:', error.message);
    }
    
    // Test 5: Meta API endpoints
    console.log('\n📋 Test 5: Meta API endpoints...');
    try {
      const metaResponse = await axios.get(`${baseURL}/api/meta/ad-account`);
      console.log('✅ Meta API successful:', metaResponse.status);
      console.log('📊 Meta data:', metaResponse.data);
    } catch (error) {
      console.error('❌ Meta API failed:', error.response?.status, error.response?.data);
      console.error('❌ Error details:', error.message);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Overall test failed:', error.message);
  }
}

// Exécuter le test
testFinalScoutInterest().catch(console.error);
