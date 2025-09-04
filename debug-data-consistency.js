const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-npchsmhe0-angelo-geracis-projects.vercel.app';

async function debugDataConsistency() {
  console.log('🔍 DEBUG DE LA COHÉRENCE DES DONNÉES');
  console.log('=====================================');

  try {
    // 1. Créer un nouveau projet avec des codes postaux spécifiques
    console.log('📋 ÉTAPE 1: Création d\'un nouveau projet...');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-consistency.csv',
        postalCodes: ['10001', '10002', '10003', '10004', '10005'],
        countryCode: 'US'
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('📡 Réponse upload complète:', JSON.stringify(uploadResponse.data, null, 2));

    if (!uploadResponse.data?.success) {
      throw new Error('Échec de la création du projet');
    }

    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé avec l'ID: ${projectId}`);
    console.log(`📊 Codes postaux uploadés: ${uploadResponse.data.results?.map(r => r.postal_code).join(', ')}`);

    // Attendre un peu pour que le projet soit traité
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Récupérer le projet et vérifier les codes postaux
    console.log('\n📋 ÉTAPE 2: Vérification du projet créé...');
    
    const projectResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    
    console.log('📡 Réponse projet complète:', JSON.stringify(projectResponse.data, null, 2));
    
    if (!projectResponse.data?.success) {
      throw new Error('Échec de la récupération du projet');
    }

    const project = projectResponse.data.project;
    if (!project) {
      throw new Error('Projet non trouvé dans la réponse');
    }

    console.log(`📊 Projet récupéré:`);
    console.log(`   - Status: ${project.status}`);
    console.log(`   - Total codes postaux: ${project.total_postal_codes}`);
    console.log(`   - Codes postaux dans le projet: ${project.postal_codes?.join(', ')}`);
    
    if (project.results) {
      console.log(`   - Résultats disponibles: ${project.results.length}`);
      project.results.forEach((result, index) => {
        console.log(`     ${index + 1}. ${result.postal_code} - Success: ${result.success}`);
      });
    }

    // 3. Vérifier la base de données directement
    console.log('\n📋 ÉTAPE 3: Vérification directe de la base de données...');
    
    try {
      const dbResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}/results`);
      
      if (dbResponse.data?.success) {
        const dbResults = dbResponse.data.results;
        console.log(`📊 Résultats en base de données:`);
        console.log(`   - Nombre total: ${dbResults.length}`);
        dbResults.forEach((result, index) => {
          console.log(`     ${index + 1}. ${result.postal_code} - Success: ${result.success}`);
          if (result.postal_code_only_estimate) {
            const estimate = typeof result.postal_code_only_estimate === 'string' 
              ? JSON.parse(result.postal_code_only_estimate) 
              : result.postal_code_only_estimate;
            console.log(`        Estimation géo: ${estimate.audience_size || 'N/A'}`);
          }
        });
      }
    } catch (dbError) {
      console.log('⚠️ Impossible de récupérer les résultats de la base:', dbError.message);
    }

    // 4. Comparaison des données
    console.log('\n🔍 ANALYSE DE COHÉRENCE');
    console.log('=========================');
    
    const uploadedCodes = uploadResponse.data.results?.map(r => r.postal_code) || [];
    const projectCodes = project.postal_codes || [];
    const resultCodes = project.results?.map(r => r.postal_code) || [];
    
    console.log(`📤 Codes postaux uploadés: ${uploadedCodes.join(', ')}`);
    console.log(`📋 Codes postaux dans le projet: ${projectCodes.join(', ')}`);
    console.log(`📊 Codes postaux dans les résultats: ${resultCodes.join(', ')}`);
    
    // Vérifier la cohérence
    const allMatch = uploadedCodes.every(code => 
      projectCodes.includes(code) && resultCodes.includes(code)
    );
    
    if (allMatch) {
      console.log('✅ COHÉRENCE PARFAITE: Tous les codes postaux correspondent');
    } else {
      console.log('❌ PROBLÈME DE COHÉRENCE DÉTECTÉ !');
      
      const missingInProject = uploadedCodes.filter(code => !projectCodes.includes(code));
      const missingInResults = uploadedCodes.filter(code => !resultCodes.includes(code));
      
      if (missingInProject.length > 0) {
        console.log(`   - Manquants dans le projet: ${missingInProject.join(', ')}`);
      }
      if (missingInResults.length > 0) {
        console.log(`   - Manquants dans les résultats: ${missingInResults.join(', ')}`);
      }
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
debugDataConsistency();
