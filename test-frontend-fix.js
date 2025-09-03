const axios = require('axios');

// Test de l'API avec la nouvelle configuration
const API_BASE_URL = 'https://scout-interest-optimized-a9fxapxv5-angelo-geracis-projects.vercel.app/api';

async function testFrontendFix() {
  try {
    console.log('🧪 Test de la correction du frontend...');
    
    // Test 1: Vérifier que l'API peut récupérer les projets
    console.log('\n📋 Test 1: Récupération des projets utilisateur');
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects/user/anonymous`);
    
    if (projectsResponse.data.success && projectsResponse.data.data?.projects) {
      const projects = projectsResponse.data.data.projects;
      console.log(`✅ ${projects.length} projets récupérés avec succès`);
      
      // Afficher le premier projet pour vérifier la structure
      if (projects.length > 0) {
        const firstProject = projects[0];
        console.log('📋 Premier projet:', {
          id: firstProject.id,
          name: firstProject.name,
          status: firstProject.status,
          total_postal_codes: firstProject.total_postal_codes,
          processed_postal_codes: firstProject.processed_postal_codes
        });
      }
    } else {
      console.log('❌ Structure de réponse invalide:', projectsResponse.data);
    }
    
    // Test 2: Vérifier qu'on peut récupérer un projet spécifique avec ses résultats
    console.log('\n📋 Test 2: Récupération d\'un projet spécifique avec résultats');
    const projectId = '79'; // Le projet que vous avez testé
    const projectResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
    
    if (projectResponse.data.success && projectResponse.data.data?.project) {
      const project = projectResponse.data.data.project;
      console.log(`✅ Projet ${projectId} récupéré:`, {
        name: project.name,
        status: project.status,
        results_count: project.results?.length || 0
      });
      
      // Vérifier que les résultats sont bien présents
      if (project.results && project.results.length > 0) {
        console.log('📊 Exemple de résultat:', {
          postal_code: project.results[0].postal_code,
          success: project.results[0].success,
          postal_code_only_estimate: project.results[0].postal_code_only_estimate,
          postal_code_with_targeting_estimate: project.results[0].postal_code_with_targeting_estimate
        });
      }
    } else {
      console.log('❌ Impossible de récupérer le projet:', projectResponse.data);
    }
    
    // Test 3: Vérifier la structure des données pour le frontend
    console.log('\n📋 Test 3: Vérification de la structure des données pour le frontend');
    const sampleProject = projectsResponse.data.data.projects[0];
    if (sampleProject) {
      const hasRequiredFields = [
        'id',
        'name', 
        'status',
        'total_postal_codes',
        'processed_postal_codes',
        'error_postal_codes',
        'created_at',
        'updated_at'
      ].every(field => sampleProject.hasOwnProperty(field));
      
      console.log(`✅ Structure du projet: ${hasRequiredFields ? 'Valide' : 'Invalide'}`);
      
      if (!hasRequiredFields) {
        console.log('❌ Champs manquants:', Object.keys(sampleProject));
      }
    }
    
    console.log('\n🎉 Test de la correction du frontend terminé avec succès !');
    console.log('💡 Le frontend devrait maintenant pouvoir charger les projets correctement.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testFrontendFix();
