const axios = require('axios');

async function testTargetingSave() {
  console.log('🧪 Testing targeting configuration save...');
  
  // Créer d'abord un projet de test
  const testProject = {
    name: 'Test Project for Targeting',
    description: 'Test project to verify targeting spec save',
    user_id: 'anonymous'
  };
  
  try {
    console.log('📝 Creating test project...');
    const createResponse = await axios.post('https://scout-interest.vercel.app/api/projects', testProject);
    
    if (!createResponse.data.success) {
      throw new Error('Failed to create test project');
    }
    
    const projectId = createResponse.data.data.project.id;
    console.log('✅ Test project created with ID:', projectId);
    
    // Test de sauvegarde de la configuration de ciblage
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
    
    console.log('📋 Saving targeting spec...');
    const saveResponse = await axios.patch(`https://scout-interest.vercel.app/api/projects/${projectId}`, {
      targeting_spec: targetingSpec
    });
    
    if (saveResponse.data.success) {
      console.log('✅ Targeting spec saved successfully!');
      console.log('📊 Response:', {
        success: saveResponse.data.success,
        projectId: saveResponse.data.data.project.id,
        targetingSpec: saveResponse.data.data.project.targeting_spec
      });
    } else {
      console.error('❌ Failed to save targeting spec:', saveResponse.data.message);
    }
    
    // Nettoyer - supprimer le projet de test
    console.log('🧹 Cleaning up test project...');
    await axios.delete(`https://scout-interest.vercel.app/api/projects/${projectId}`);
    console.log('✅ Test project cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
  }
}

// Exécuter le test
testTargetingSave().catch(console.error);
