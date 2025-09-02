const axios = require('axios');

async function testUSPostalCodes() {
  console.log('🧪 Testing analysis with US postal codes...');
  
  try {
    // 1. Créer un projet de test
    console.log('📝 Step 1: Creating test project...');
    const projectResponse = await axios.post('https://scout-interest.vercel.app/api/projects', {
      name: 'US Postal Codes Test',
      description: 'Testing analysis with US postal codes',
      user_id: 'anonymous'
    });
    
    if (!projectResponse.data.success) {
      throw new Error('Failed to create test project');
    }
    
    const projectId = projectResponse.data.data.project.id;
    console.log('✅ Test project created with ID:', projectId);
    
    // 2. Configuration de ciblage simple
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
    
    // 3. Lancer l'analyse avec des codes postaux américains
    console.log('🚀 Step 2: Launching analysis with US postal codes...');
    const analysisRequest = {
      adAccountId: 'act_123456789', // Mock ad account ID
      postalCodes: ['10001', '10002', '10003', '10004', '10005'], // New York ZIP codes
      countryCode: 'US',
      targetingSpec,
      projectId: parseInt(projectId, 10)
    };
    
    console.log('📤 Sending analysis request...');
    const analysisResponse = await axios.post(
      'https://scout-interest.vercel.app/api/meta/batch-postal-codes-reach-estimate-v2',
      analysisRequest,
      {
        timeout: 60000 // 60 secondes de timeout
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
      
      // 4. Vérifier les résultats sauvegardés
      console.log('📋 Step 3: Checking saved results...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
      
      const resultsResponse = await axios.get(`https://scout-interest.vercel.app/api/projects/${projectId}/results`);
      
      if (resultsResponse.data.success) {
        const results = resultsResponse.data.data.results;
        console.log('✅ Results retrieved from database:', results.length, 'items');
        
        if (results.length > 0) {
          console.log('📊 Sample result:', {
            postal_code: results[0].postal_code,
            success: results[0].success,
            has_estimates: !!(results[0].postal_code_only_estimate || results[0].postal_code_with_targeting_estimate),
            error_message: results[0].error_message
          });
          
          // Afficher les détails des erreurs si il y en a
          if (results[0].error_message) {
            console.log('❌ Error message:', results[0].error_message);
          }
        }
      } else {
        console.error('❌ Failed to retrieve results:', resultsResponse.data.message);
      }
    } else {
      console.error('❌ Analysis failed:', analysisResponse.data.message);
    }
    
    // 5. Nettoyer
    console.log('🧹 Step 4: Cleaning up test project...');
    await axios.delete(`https://scout-interest.vercel.app/api/projects/${projectId}`);
    console.log('✅ Test project cleaned up');
    
    console.log('🎉 US postal codes test finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    // Afficher plus de détails sur l'erreur
    if (error.response?.data) {
      console.error('📋 Error response details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Exécuter le test
testUSPostalCodes().catch(console.error);
