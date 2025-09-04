const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-ct00czoui-angelo-geracis-projects.vercel.app';

async function testFrontendDataFlow() {
  console.log('🔍 TEST DU FLUX DE DONNÉES FRONTEND');
  console.log('====================================');
  
  try {
    // 1. Créer un projet via upload
    console.log('\n📤 Étape 1: Création du projet via upload');
    console.log('---------------------------------------------');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-frontend-flow.csv',
        postalCodes: ['75001', '75002']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }
    
    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);
    
    // Attendre le traitement
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. Simuler l'appel du frontend (projectService.getProject)
    console.log('\n🔍 Étape 2: Simulation de projectService.getProject()');
    console.log('------------------------------------------------------');
    
    const frontendResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    
    if (frontendResponse.data?.success) {
      console.log(`✅ Réponse de l'API pour le frontend:`);
      console.log(`   - Success: ${frontendResponse.data.success}`);
      console.log(`   - Has project: ${!!frontendResponse.data.data?.project}`);
      
      if (frontendResponse.data.data?.project) {
        const project = frontendResponse.data.data.project;
        console.log(`   - Nom du projet: ${project.name}`);
        console.log(`   - Résultats: ${project.results?.length || 0}`);
        
        // 3. Simuler la transformation du hook useProject
        console.log('\n🔍 Étape 3: Simulation de la transformation useProject');
        console.log('------------------------------------------------------');
        
        if (project.results && Array.isArray(project.results)) {
          console.log('\n📊 Données brutes de l\'API (avant transformation):');
          project.results.forEach(result => {
            console.log(`   - ${result.postal_code}:`);
            console.log(`     * postal_code_only_estimate:`, result.postal_code_only_estimate);
            console.log(`     * postal_code_with_targeting_estimate:`, result.postal_code_with_targeting_estimate);
          });
          
          // Simuler la transformation exacte du hook useProject
          console.log('\n🔄 Transformation des données (comme dans useProject):');
          const transformedResults = project.results.map((result) => ({
            postal_code: result.postal_code,
            success: result.success,
            audience_estimate: result.postal_code_only_estimate?.audience_size || 0,
            targeting_estimate: result.postal_code_with_targeting_estimate?.audience_size || 0,
            error: result.error_message || undefined
          }));
          
          console.log('\n📊 Données transformées (après useProject):');
          transformedResults.forEach(result => {
            console.log(`   - ${result.postal_code}:`);
            console.log(`     * audience_estimate: ${result.audience_estimate}`);
            console.log(`     * targeting_estimate: ${result.targeting_estimate}`);
          });
          
          // 4. Vérifier la cohérence avec les données d'upload
          console.log('\n🔍 Étape 4: Vérification de la cohérence');
          console.log('--------------------------------------------');
          
          const uploadData = {};
          uploadResponse.data.results.forEach(result => {
            uploadData[result.postal_code] = {
              audience: result.audience_estimate,
              targeting: result.targeting_estimate
            };
          });
          
          let allDataConsistent = true;
          transformedResults.forEach(result => {
            const uploadAudience = uploadData[result.postal_code]?.audience;
            const uploadTargeting = uploadData[result.postal_code]?.targeting;
            
            if (result.audience_estimate !== uploadAudience || result.targeting_estimate !== uploadTargeting) {
              console.log(`   ❌ ${result.postal_code}: Données incohérentes !`);
              console.log(`      Upload: ${uploadAudience} / ${uploadTargeting}`);
              console.log(`      Frontend: ${result.audience_estimate} / ${result.targeting_estimate}`);
              allDataConsistent = false;
            } else {
              console.log(`   ✅ ${result.postal_code}: Données cohérentes`);
            }
          });
          
          if (allDataConsistent) {
            console.log('\n🎉 SUCCÈS: Toutes les données sont cohérentes !');
          } else {
            console.log('\n🚨 PROBLÈME: Données incohérentes détectées !');
          }
          
        } else {
          console.log('   ❌ Aucun résultat trouvé dans le projet');
        }
        
      } else {
        console.log('   ❌ Pas de projet dans la réponse');
      }
      
    } else {
      console.log('   ❌ Réponse API invalide:', frontendResponse.data);
    }
    
    // 5. Test direct de l'endpoint avec le même projectId
    console.log('\n🔍 Étape 5: Test direct de l\'endpoint (comparaison)');
    console.log('----------------------------------------------------');
    
    const directResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    
    if (directResponse.data?.success && directResponse.data?.data?.project) {
      const directProject = directResponse.data.data.project;
      console.log(`✅ Projet récupéré directement:`);
      console.log(`   - Résultats: ${directProject.results?.length || 0}`);
      
      if (directProject.results && directProject.results.length > 0) {
        console.log('\n📊 Données directes (pour comparaison):');
        directProject.results.forEach(result => {
          console.log(`   - ${result.postal_code}:`);
          console.log(`     * postal_code_only_estimate:`, result.postal_code_only_estimate);
          console.log(`     * postal_code_with_targeting_estimate:`, result.postal_code_with_targeting_estimate);
        });
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR DE TEST:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Lancer le test
testFrontendDataFlow();

