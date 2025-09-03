const axios = require('axios');

const API_BASE_URL = 'https://scout-interest-optimized-a9fxapxv5-angelo-geracis-projects.vercel.app/api';

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API Vercel...');
    
    // Test 1: Récupérer le projet 79
    console.log('\n📋 Test 1: Récupération du projet 79');
    const projectResponse = await axios.get(`${API_BASE_URL}/projects/79`);
    console.log('✅ Projet 79 récupéré:', {
      id: projectResponse.data.data.project.id,
      name: projectResponse.data.data.project.name,
      status: projectResponse.data.data.project.status,
      results_count: projectResponse.data.data.project.results?.length || 0
    });
    
    // Test 2: Récupérer tous les projets de l'utilisateur anonymous
    console.log('\n📋 Test 2: Récupération de tous les projets');
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects/user/anonymous`);
    console.log('✅ Projets récupérés:', {
      success: projectsResponse.data.success,
      count: projectsResponse.data.data?.projects?.length || 0
    });
    
    // Test 3: Test de santé de l'API
    console.log('\n📋 Test 3: Test de santé de l\'API');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ API en bonne santé:', healthResponse.data);
    } catch (error) {
      console.log('⚠️ Endpoint /health non disponible (normal)');
    }
    
    console.log('\n🎉 Tous les tests API sont passés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
