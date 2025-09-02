const axios = require('axios');

async function debugResultsDisplay() {
  console.log('🔍 Debugging results display issue...');
  
  try {
    // 1. Vérifier la santé de l'API
    console.log('📋 Step 1: Checking API health...');
    const healthResponse = await axios.get('https://scout-interest-ubcilbjv2-angelo-geracis-projects.vercel.app/api/health');
    console.log('✅ Health check:', {
      status: healthResponse.data.status,
      database: healthResponse.data.services?.database,
      meta_api: healthResponse.data.services?.meta_api
    });
    
    // 2. Lister les projets récents
    console.log('\n📋 Step 2: Listing recent projects...');
    const projectsResponse = await axios.get('https://scout-interest-ubcilbjv2-angelo-geracis-projects.vercel.app/api/projects/user/anonymous');
    
    if (projectsResponse.data.success) {
      const projects = projectsResponse.data.data.projects;
      console.log(`✅ Found ${projects.length} projects`);
      
      if (projects.length > 0) {
        // Prendre le projet le plus récent
        const latestProject = projects[0];
        console.log('📋 Latest project:', {
          id: latestProject.id,
          name: latestProject.name,
          status: latestProject.status,
          total_postal_codes: latestProject.total_postal_codes,
          processed_postal_codes: latestProject.processed_postal_codes,
          error_postal_codes: latestProject.error_postal_codes
        });
        
        // 3. Vérifier les résultats de ce projet
        console.log('\n📋 Step 3: Checking project results...');
        const resultsResponse = await axios.get(`https://scout-interest-ubcilbjv2-angelo-geracis-projects.vercel.app/api/projects/${latestProject.id}/results`);
        
        if (resultsResponse.data.success) {
          const results = resultsResponse.data.data.results;
          console.log(`✅ Found ${results.length} results for project ${latestProject.id}`);
          
          if (results.length > 0) {
            console.log('📊 Sample results:');
            results.slice(0, 3).forEach((result, index) => {
              console.log(`\n  Result ${index + 1}:`);
              console.log(`    - Postal Code: ${result.postal_code}`);
              console.log(`    - Country: ${result.country_code}`);
              console.log(`    - Success: ${result.success}`);
              console.log(`    - Status: ${result.success ? 'completed' : 'error'}`);
              console.log(`    - Error: ${result.error_message || 'None'}`);
              console.log(`    - Has Estimates: ${!!(result.postal_code_only_estimate || result.postal_code_with_targeting_estimate)}`);
              
              if (result.postal_code_only_estimate) {
                console.log(`    - Postal Code Only: ${JSON.stringify(result.postal_code_only_estimate).substring(0, 100)}...`);
              }
              
              if (result.postal_code_with_targeting_estimate) {
                console.log(`    - With Targeting: ${JSON.stringify(result.postal_code_with_targeting_estimate).substring(0, 100)}...`);
              }
            });
          } else {
            console.log('❌ No results found in database');
          }
        } else {
          console.error('❌ Failed to get project results:', resultsResponse.data.message);
        }
        
        // 4. Vérifier le statut de traitement du projet
        console.log('\n📋 Step 4: Checking project processing status...');
        const statusResponse = await axios.get(`https://scout-interest-ubcilbjv2-angelo-geracis-projects.vercel.app/api/projects/${latestProject.id}/status`);
        
        if (statusResponse.data.success) {
          const status = statusResponse.data.data.status;
          console.log('✅ Project status:', {
            total: status.total,
            completed: status.completed,
            success: status.success,
            errors: status.errors,
            isProcessing: status.isProcessing
          });
        } else {
          console.error('❌ Failed to get project status:', statusResponse.data.message);
        }
        
      } else {
        console.log('❌ No projects found');
      }
    } else {
      console.error('❌ Failed to get projects:', projectsResponse.data.message);
    }
    
    // 5. Tester la création d'un nouveau projet avec analyse
    console.log('\n📋 Step 5: Testing new project creation and analysis...');
    
    try {
      // Créer un projet de test
      const testProjectResponse = await axios.post('https://scout-interest-ubcilbjv2-angelo-geracis-projects.vercel.app/api/projects', {
        name: 'Debug Test Project',
        description: 'Testing results display',
        user_id: 'anonymous'
      });
      
      if (testProjectResponse.data.success) {
        const testProjectId = testProjectResponse.data.data.project.id;
        console.log('✅ Test project created:', testProjectId);
        
        // Lancer une analyse simple
        const analysisRequest = {
          adAccountId: 'act_323074088483830', // Vrai Ad Account ID
          postalCodes: ['10001', '10002'],
          countryCode: 'US',
          targetingSpec: {
            interestGroups: [
              {
                id: 'group-1',
                name: 'Test',
                operator: 'OR',
                interests: [
                  { id: '6002714398172', name: 'Technology' }
                ]
              }
            ],
            geo_locations: [{ countries: ['US'] }],
            age_min: 18,
            age_max: 65,
            genders: ['1', '2'],
            device_platforms: ['mobile', 'desktop']
          },
          projectId: parseInt(testProjectId, 10)
        };
        
        console.log('📤 Launching test analysis...');
        const analysisResponse = await axios.post(
          'https://scout-interest-ubcilbjv2-angelo-geracis-projects.vercel.app/api/meta/batch-postal-codes-reach-estimate-v2',
          analysisRequest,
          { timeout: 60000 }
        );
        
        console.log('📥 Analysis response:', {
          success: analysisResponse.data.success,
          totalProcessed: analysisResponse.data.data?.totalProcessed,
          successful: analysisResponse.data.data?.successful,
          errors: analysisResponse.data.data?.errors
        });
        
        if (analysisResponse.data.success) {
          // Attendre un peu puis vérifier les résultats
          console.log('⏳ Waiting for results to be saved...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const testResultsResponse = await axios.get(`https://scout-interest-ubcilbjv2-angelo-geracis-projects.vercel.app/api/projects/${testProjectId}/results`);
          
          if (testResultsResponse.data.success) {
            const testResults = testResultsResponse.data.data.results;
            console.log(`✅ Test results: ${testResults.length} items`);
            
            testResults.forEach((result, index) => {
              console.log(`  - ${result.postal_code}: Success=${result.success}, Status=${result.success ? 'completed' : 'error'}`);
            });
          }
        }
        
        // Nettoyer le projet de test
        await axios.delete(`https://scout-interest-ubcilbjv2-angelo-geracis-projects.vercel.app/api/projects/${testProjectId}`);
        console.log('✅ Test project cleaned up');
      }
    } catch (error) {
      console.error('❌ Test analysis failed:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message
    });
  }
}

// Exécuter le debug
debugResultsDisplay().catch(console.error);
