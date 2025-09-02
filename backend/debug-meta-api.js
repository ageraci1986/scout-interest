const axios = require('axios');

async function debugMetaAPI() {
  console.log('🔍 Debugging Meta API issues...');
  
  try {
    // 1. Vérifier la configuration Meta
    console.log('📋 Step 1: Checking Meta API configuration...');
    
    const configResponse = await axios.get('https://scout-interest.vercel.app/api/meta/config');
    console.log('✅ Meta config response:', {
      success: configResponse.data.success,
      hasAdAccount: !!configResponse.data.data?.ad_account_id,
      hasAccessToken: !!configResponse.data.data?.access_token,
      hasAppId: !!configResponse.data.data?.app_id
    });
    
    if (configResponse.data.success) {
      const config = configResponse.data.data;
      console.log('📋 Meta API Config:', {
        ad_account_id: config.ad_account_id,
        access_token: config.access_token ? 'SET' : 'NOT_SET',
        app_id: config.app_id,
        api_version: config.api_version
      });
    }
    
    // 2. Tester une requête simple vers Meta
    console.log('\n📋 Step 2: Testing simple Meta API call...');
    
    try {
      const testResponse = await axios.post('https://scout-interest.vercel.app/api/meta/reach-estimate', {
        adAccountId: 'act_123456789', // Mock ID
        targetingSpec: {
          geo_locations: [{ countries: ['FR'] }],
          age_min: 18,
          age_max: 65,
          genders: ['1', '2'],
          device_platforms: ['mobile', 'desktop']
        }
      });
      
      console.log('✅ Simple reach estimate response:', {
        success: testResponse.data.success,
        message: testResponse.data.message
      });
      
    } catch (error) {
      console.error('❌ Simple reach estimate failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      
      if (error.response?.data) {
        console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // 3. Tester avec un vrai ad account ID si disponible
    if (configResponse.data.success && configResponse.data.data?.ad_account_id) {
      console.log('\n📋 Step 3: Testing with real ad account...');
      
      try {
        const realTestResponse = await axios.post('https://scout-interest.vercel.app/api/meta/reach-estimate', {
          adAccountId: configResponse.data.data.ad_account_id,
          targetingSpec: {
            geo_locations: [{ countries: ['FR'] }],
            age_min: 18,
            age_max: 65,
            genders: ['1', '2'],
            device_platforms: ['mobile', 'desktop']
          }
        });
        
        console.log('✅ Real ad account test response:', {
          success: realTestResponse.data.success,
          message: realTestResponse.data.message
        });
        
      } catch (error) {
        console.error('❌ Real ad account test failed:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        
        if (error.response?.data) {
          console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
        }
      }
    }
    
    // 4. Vérifier les variables d'environnement sur Vercel
    console.log('\n📋 Step 4: Checking environment variables...');
    
    const healthResponse = await axios.get('https://scout-interest.vercel.app/api/health');
    console.log('✅ Health check response:', {
      status: healthResponse.data.status,
      database_url: healthResponse.data.database_url,
      services: healthResponse.data.services
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message
    });
  }
}

// Exécuter le debug
debugMetaAPI().catch(console.error);
