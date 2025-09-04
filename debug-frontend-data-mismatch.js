const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-npchsmhe0-angelo-geracis-projects.vercel.app';

async function debugFrontendDataMismatch() {
  console.log('🔍 DEBUG DU DÉCALAGE FRONTEND/BACKEND');
  console.log('======================================');

  try {
    // 1. Lister tous les projets pour identifier le dernier
    console.log('📋 ÉTAPE 1: Récupération de tous les projets...');
    
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`);
    
    if (!projectsResponse.data?.success) {
      throw new Error('Échec de la récupération des projets');
    }

    const projects = projectsResponse.data.projects || [];
    console.log(`📊 Nombre total de projets: ${projects.length}`);
    
    if (projects.length === 0) {
      console.log('❌ Aucun projet trouvé');
      return;
    }

    // Trier par date de création (le plus récent en premier)
    const sortedProjects = projects.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    const latestProject = sortedProjects[0];
    console.log(`\n🏆 DERNIER PROJET IDENTIFIÉ:`);
    console.log(`   - ID: ${latestProject.id}`);
    console.log(`   - Nom: ${latestProject.name}`);
    console.log(`   - Créé le: ${latestProject.created_at}`);
    console.log(`   - Status: ${latestProject.status}`);
    console.log(`   - Total codes postaux: ${latestProject.total_postal_codes}`);

    // 2. Récupérer les détails complets du dernier projet
    console.log('\n📋 ÉTAPE 2: Détails complets du dernier projet...');
    
    const projectDetailsResponse = await axios.get(`${BASE_URL}/api/projects/${latestProject.id}`);
    
    if (!projectDetailsResponse.data?.success) {
      throw new Error('Échec de la récupération des détails du projet');
    }

    const projectDetails = projectDetailsResponse.data.data?.project;
    if (!projectDetails) {
      throw new Error('Projet non trouvé dans la réponse');
    }

    console.log(`📊 Détails du projet ${latestProject.id}:`);
    console.log(`   - Codes postaux dans le projet: ${projectDetails.postal_codes?.join(', ') || 'Non défini'}`);
    console.log(`   - Résultats disponibles: ${projectDetails.results?.length || 0}`);
    
    if (projectDetails.results && projectDetails.results.length > 0) {
      console.log('\n📋 RÉSULTATS DÉTAILLÉS:');
      projectDetails.results.forEach((result, index) => {
        console.log(`   ${index + 1}. Code postal: ${result.postal_code}`);
        console.log(`      - Success: ${result.success}`);
        console.log(`      - Estimation géo: ${result.postal_code_only_estimate?.audience_size || 'N/A'}`);
        console.log(`      - Estimation targeting: ${result.postal_code_with_targeting_estimate?.audience_size || 'N/A'}`);
        console.log(`      - Traité le: ${result.processed_at}`);
      });
    }

    // 3. Vérifier s'il y a des projets avec des codes postaux 75001-75005
    console.log('\n🔍 RECHERCHE DE PROJETS AVEC CODES POSTAUX 75001-75005...');
    
    const projectsWithFrenchCodes = projects.filter(project => {
      if (project.postal_codes) {
        return project.postal_codes.some(code => code.startsWith('750'));
      }
      return false;
    });

    if (projectsWithFrenchCodes.length > 0) {
      console.log(`⚠️ PROJETS AVEC CODES POSTAUX FRANÇAIS TROUVÉS: ${projectsWithFrenchCodes.length}`);
      projectsWithFrenchCodes.forEach(project => {
        console.log(`   - Projet ID ${project.id}: ${project.name}`);
        console.log(`     Codes postaux: ${project.postal_codes?.join(', ')}`);
        console.log(`     Créé le: ${project.created_at}`);
      });
    } else {
      console.log('✅ Aucun projet avec des codes postaux français trouvé');
    }

    // 4. Analyse de la cohérence
    console.log('\n🔍 ANALYSE DE COHÉRENCE');
    console.log('=========================');
    
    const expectedCodes = projectDetails.postal_codes || [];
    const actualResults = projectDetails.results?.map(r => r.postal_code) || [];
    
    console.log(`📤 Codes postaux attendus (dans le projet): ${expectedCodes.join(', ')}`);
    console.log(`📊 Codes postaux dans les résultats: ${actualResults.join(', ')}`);
    
    if (expectedCodes.length === 0) {
      console.log('⚠️ ATTENTION: Aucun code postal défini dans le projet !');
    }
    
    if (actualResults.length === 0) {
      console.log('⚠️ ATTENTION: Aucun résultat disponible !');
    }

    // 5. Vérifier si le projet a été traité par Meta API
    console.log('\n📋 ÉTAPE 3: Vérification du traitement Meta API...');
    
    const hasMetaEstimates = projectDetails.results?.some(result => 
      result.postal_code_only_estimate?.audience_size > 0 ||
      result.postal_code_with_targeting_estimate?.audience_size > 0
    );
    
    if (hasMetaEstimates) {
      console.log('✅ Meta API a été appelée et a retourné des estimations');
    } else {
      console.log('❌ Meta API n\'a pas été appelée ou n\'a pas retourné d\'estimations');
      console.log('   - Toutes les estimations sont à 0 ou null');
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Lancer le debug
debugFrontendDataMismatch();
