const axios = require('axios');

async function testCompleteAnalysis() {
  console.log('🧪 Testing complete analysis workflow...');
  
  try {
    // 1. Créer un projet de test
    console.log('📝 Step 1: Creating test project...');
    const projectResponse = await axios.post('https://scout-interest.vercel.app/api/projects', {
      name: 'Test Analysis Project',
      description: 'Project to test complete analysis workflow',
      user_id: 'anonymous'
    });
    
    if (!projectResponse.data.success) {
      throw new Error('Failed to create test project');
    }
    
    const projectId = projectResponse.data.data.project.id;
    console.log('✅ Test project created with ID:', projectId);
    
    // 2. Définir une configuration de ciblage
    const targetingSpec = {
      interestGroups: [
        {
          id: 'group-1',
          name: 'Test Group',
          operator: 'OR',
          interests: [
            { id: '6002714398172', name: 'Technology' },
            { id: '6002714398572', name: 'Software' }
          ]
        }
      ],
      geo_locations: [
        {
          countries: ['FR']
        }
      ],
      age_min: 18,
      age_max: 65,
      genders: ['1', '2'],
      device_platforms: ['mobile', 'desktop']
    };
    
    // 3. Sauvegarder la configuration de ciblage
    console.log('📋 Step 2: Saving targeting spec...');
    const targetingResponse = await axios.patch(`https://scout-interest.vercel.app/api/projects/${projectId}`, {
      targeting_spec: targetingSpec
    });
    
    if (!targetingResponse.data.success) {
      throw new Error('Failed to save targeting spec');
    }
    
    console.log('✅ Targeting spec saved successfully');
    
    // 4. Lancer l'analyse avec quelques codes postaux de test
    console.log('🚀 Step 3: Launching analysis...');
    const analysisRequest = {
      adAccountId: 'act_123456789', // Mock ad account ID
      postalCodes: ['75001', '75002', '75003', '75004', '75005'],
      countryCode: 'FR',
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
      
      // 5. Vérifier que les résultats sont sauvegardés
      console.log('📋 Step 4: Checking saved results...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
      
      const resultsResponse = await axios.get(`https://scout-interest.vercel.app/api/projects/${projectId}/results`);
      
      if (resultsResponse.data.success) {
        const results = resultsResponse.data.data.results;
        console.log('✅ Results retrieved from database:', results.length, 'items');
        
        if (results.length > 0) {
          console.log('📊 Sample result:', {
            postal_code: results[0].postal_code,
            success: results[0].success,
            has_estimates: !!(results[0].postal_code_only_estimate || results[0].postal_code_with_targeting_estimate)
          });
        }
      } else {
        console.error('❌ Failed to retrieve results:', resultsResponse.data.message);
      }
    } else {
      console.error('❌ Analysis failed:', analysisResponse.data.message);
    }
    
    // 6. Nettoyer - supprimer le projet de test
    console.log('🧹 Step 5: Cleaning up test project...');
    await axios.delete(`https://scout-interest.vercel.app/api/projects/${projectId}`);
    console.log('✅ Test project cleaned up');
    
    console.log('🎉 Complete analysis test finished!');
    
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
testCompleteAnalysis().catch(console.error);
