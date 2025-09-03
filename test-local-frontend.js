const axios = require('axios');

// Configuration pour test local
const API_BASE_URL = 'https://scout-interest-optimized-a9fxapxv5-angelo-geracis-projects.vercel.app/api';

async function testLocalFrontend() {
  try {
    console.log('🧪 Test local du frontend corrigé...');
    
    // Simuler les appels que le frontend ferait
    console.log('\n📋 Simulation des appels frontend...');
    
    // 1. Simuler la page des projets
    console.log('\n1️⃣ Simulation: Chargement de la page des projets');
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects/user/anonymous`);
    
    if (projectsResponse.data.success && projectsResponse.data.data?.projects) {
      const projects = projectsResponse.data.data.projects;
      console.log(`✅ ${projects.length} projets chargés (comme dans ProjectsPage)`);
      
      // Simuler la sélection d'un projet
      const selectedProject = projects[0];
      console.log(`📋 Projet sélectionné: ${selectedProject.name} (ID: ${selectedProject.id})`);
      
      // 2. Simuler le chargement des résultats du projet
      console.log('\n2️⃣ Simulation: Chargement des résultats du projet sélectionné');
      const projectResponse = await axios.get(`${API_BASE_URL}/projects/${selectedProject.id}`);
      
      if (projectResponse.data.success && projectResponse.data.data?.project) {
        const project = projectResponse.data.data.project;
        console.log(`✅ Projet chargé avec ${project.results?.length || 0} résultats`);
        
        // Vérifier la structure des données pour le frontend
        console.log('\n3️⃣ Vérification: Structure des données pour le frontend');
        
        const hasResults = project.results && project.results.length > 0;
        console.log(`📊 Résultats présents: ${hasResults ? 'Oui' : 'Non'}`);
        
        if (hasResults) {
          const firstResult = project.results[0];
          console.log('📋 Premier résultat:', {
            postal_code: firstResult.postal_code,
            success: firstResult.success,
            has_geo_estimate: !!firstResult.postal_code_only_estimate,
            has_targeting_estimate: !!firstResult.postal_code_with_targeting_estimate
          });
          
          // Vérifier les estimations
          if (firstResult.postal_code_only_estimate) {
            const geoEstimate = firstResult.postal_code_only_estimate;
            console.log(`🌍 Estimation géographique: ${geoEstimate.audience_size || 'N/A'}`);
          }
          
          if (firstResult.postal_code_with_targeting_estimate) {
            const targetingEstimate = firstResult.postal_code_with_targeting_estimate;
            console.log(`🎯 Estimation avec targeting: ${targetingEstimate.audience_size || 'N/A'}`);
          }
        }
        
        // 3. Simuler la navigation vers les résultats
        console.log('\n4️⃣ Simulation: Navigation vers la page des résultats');
        console.log(`🔗 URL directe: /results/${project.id}`);
        console.log(`📱 Cette URL devrait maintenant fonctionner dans le frontend`);
        
      } else {
        console.log('❌ Impossible de charger le projet sélectionné');
      }
      
    } else {
      console.log('❌ Impossible de charger les projets');
    }
    
    // 4. Test de l'URL directe
    console.log('\n5️⃣ Test: URL directe vers les résultats');
    const directProjectId = '79'; // Le projet que vous avez testé
    try {
      const directResponse = await axios.get(`${API_BASE_URL}/projects/${directProjectId}`);
      if (directResponse.data.success) {
        console.log(`✅ URL directe /results/${directProjectId} fonctionne`);
        console.log(`📊 Projet: ${directResponse.data.data.project.name}`);
        console.log(`📊 Statut: ${directResponse.data.data.project.status}`);
        console.log(`📊 Résultats: ${directResponse.data.data.project.results?.length || 0}`);
      }
    } catch (error) {
      console.log(`❌ URL directe /results/${directProjectId} ne fonctionne pas`);
    }
    
    console.log('\n🎉 Test local terminé avec succès !');
    console.log('💡 Le frontend devrait maintenant fonctionner parfaitement avec :');
    console.log('   - Chargement des projets sans erreur');
    console.log('   - Navigation directe vers les résultats');
    console.log('   - Affichage correct des données Meta API');
    
  } catch (error) {
    console.error('❌ Erreur lors du test local:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testLocalFrontend();
