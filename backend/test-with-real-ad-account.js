const axios = require('axios');

async function testWithRealAdAccount() {
  console.log('🧪 Testing with real Ad Account ID...');
  
  try {
    // 1. Récupérer la vraie configuration Meta
    console.log('📋 Step 1: Getting real Meta configuration...');
    const configResponse = await axios.get('https://scout-interest.vercel.app/api/meta/ad-account');
    
    if (!configResponse.data.success) {
      throw new Error('Failed to get Meta configuration');
    }
    
    const realAdAccountId = configResponse.data.data.ad_account_id;
    const isConfigured = configResponse.data.data.is_configured;
    
    console.log('✅ Meta configuration:', {
      ad_account_id: realAdAccountId,
      is_configured: isConfigured
    });
    
    if (!isConfigured) {
      throw new Error('Meta API is not properly configured');
    }
    
    // 2. Créer un projet de test
    console.log('\n📝 Step 2: Creating test project...');
    const projectResponse = await axios.post('https://scout-interest.vercel.app/api/projects', {
      name: 'Real Ad Account Test',
      description: 'Testing with real Meta Ad Account ID',
      user_id: 'anonymous'
    });
    
    if (!projectResponse.data.success) {
      throw new Error('Failed to create test project');
    }
    
    const projectId = projectResponse.data.data.project.id;
    console.log('✅ Test project created with ID:', projectId);
    
    // 3. Configuration de ciblage simple
    const targetingSpec = {
      interestGroups: [
        {
          id: 'group-1',
          name: 'Technology',
          operator: 'OR',
          interests: [
            { id: '6002714398172', name: 'Technology' }
          ]
        }
      ],
      geo_locations: [
        {
          countries: ['US']
        }
      ],
      age_min: 18,
      age_max: 65,
      genders: ['1', '2'],
      device_platforms: ['mobile', 'desktop']
    };
    
    // 4. Sauvegarder la configuration de ciblage
    console.log('\n📋 Step 3: Saving targeting spec...');
    const targetingResponse = await axios.patch(`https://scout-interest.vercel.app/api/projects/${projectId}`, {
      targeting_spec: targetingSpec
    });
    
    if (!targetingResponse.data.success) {
      throw new Error('Failed to save targeting spec');
    }
    
    console.log('✅ Targeting spec saved successfully');
    
    // 5. Lancer l'analyse avec le VRAI Ad Account ID
    console.log('\n🚀 Step 4: Launching analysis with REAL Ad Account ID...');
    const analysisRequest = {
      adAccountId: realAdAccountId, // VRAI Ad Account ID !
      postalCodes: ['10001', '10002', '10003'],
      countryCode: 'US',
      targetingSpec,
      projectId: parseInt(projectId, 10)
    };
    
    console.log('📤 Sending analysis request with real adAccountId:', realAdAccountId);
    
    const analysisResponse = await axios.post(
      'https://scout-interest.vercel.app/api/meta/batch-postal-codes-reach-estimate-v2',
      analysisRequest,
      {
        timeout: 60000
      }
    );
    
    console.log('📥 Analysis response received:', {
      success: analysisResponse.data.success,
      totalProcessed: analysisResponse.data.data?.totalProcessed,
      successful: analysisResponse.data.data?.successful,
      errors: analysisResponse.data.data?.errors,
      projectId: analysisResponse.data.data?.projectId
    });
    
    if (analysisResponse.data.success) {
      console.log('✅ Analysis completed successfully');
      
      // 6. Vérifier les résultats sauvegardés
      console.log('\n📋 Step 5: Checking saved results...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const resultsResponse = await axios.get(`https://scout-interest.vercel.app/api/projects/${projectId}/results`);
      
      if (resultsResponse.data.success) {
        const results = resultsResponse.data.data.results;
        console.log('✅ Results retrieved from database:', results.length, 'items');
        
        if (results.length > 0) {
          results.forEach((result, index) => {
            console.log(`\n📊 Result ${index + 1}:`);
            console.log(`  - Postal Code: ${result.postal_code}`);
            console.log(`  - Success: ${result.success}`);
            console.log(`  - Error: ${result.error_message || 'None'}`);
            console.log(`  - Has Estimates: ${!!(result.postal_code_only_estimate || result.postal_code_with_targeting_estimate)}`);
            
            if (result.success && result.postal_code_only_estimate) {
              console.log(`  - Postal Code Only: ${result.postal_code_only_estimate.data?.users_lower_bound || 'N/A'} - ${result.postal_code_only_estimate.data?.users_upper_bound || 'N/A'}`);
            }
            
            if (result.success && result.postal_code_with_targeting_estimate) {
              console.log(`  - With Targeting: ${result.postal_code_with_targeting_estimate.data?.users_lower_bound || 'N/A'} - ${result.postal_code_with_targeting_estimate.data?.users_upper_bound || 'N/A'}`);
            }
          });
        }
      } else {
        console.error('❌ Failed to retrieve results:', resultsResponse.data.message);
      }
    } else {
      console.error('❌ Analysis failed:', analysisResponse.data.message);
    }
    
    // 7. Nettoyer
    console.log('\n🧹 Step 6: Cleaning up test project...');
    await axios.delete(`https://scout-interest.vercel.app/api/projects/${projectId}`);
    console.log('✅ Test project cleaned up');
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message
    });
    
    if (error.response?.data) {
      console.error('📋 Error response details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Exécuter le test
testWithRealAdAccount().catch(console.error);
