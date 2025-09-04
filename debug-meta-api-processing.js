const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-lqikf928h-angelo-geracis-projects.vercel.app';

async function debugMetaAPIProcessing() {
  console.log('🔍 DEBUG DU TRAITEMENT META API');
  console.log('================================');

  try {
    // 1. Vérifier le statut du projet 79
    console.log('📋 ÉTAPE 1: Vérification du projet 79...');
    
    const projectResponse = await axios.get(`${BASE_URL}/api/projects/79`);
    
    if (!projectResponse.data?.success) {
      throw new Error('Échec de la récupération du projet');
    }

    const project = projectResponse.data.data?.project;
    if (!project) {
      throw new Error('Projet non trouvé dans la réponse');
    }

    console.log(`📊 Projet 79:`);
    console.log(`   - Status: ${project.status}`);
    console.log(`   - Total codes postaux: ${project.total_postal_codes}`);
    console.log(`   - Traités: ${project.processed_postal_codes}`);
    console.log(`   - Erreurs: ${project.error_postal_codes}`);
    
    if (project.results) {
      console.log(`   - Résultats disponibles: ${project.results.length}`);
      console.log('\n📋 RÉSULTATS DÉTAILLÉS:');
      project.results.forEach((result, index) => {
        console.log(`   ${index + 1}. Code postal: ${result.postal_code}`);
        console.log(`      - Success: ${result.success}`);
        console.log(`      - Estimation géo: ${result.postal_code_only_estimate?.audience_size || 'N/A'}`);
        console.log(`      - Estimation targeting: ${result.postal_code_with_targeting_estimate?.audience_size || 'N/A'}`);
        console.log(`      - Traité le: ${result.processed_at}`);
      });
    }

    // 2. Analyser pourquoi seulement 2/5 ont été traités
    console.log('\n🔍 ANALYSE DU PROBLÈME');
    console.log('========================');
    
    if (project.processed_postal_codes < project.total_postal_codes) {
      console.log(`❌ PROBLÈME IDENTIFIÉ: Seulement ${project.processed_postal_codes}/${project.total_postal_codes} codes postaux traités`);
      
      if (project.results) {
        const processedCodes = project.results.map(r => r.postal_code);
        const allCodes = project.postal_codes || [];
        
        const missingCodes = allCodes.filter(code => !processedCodes.includes(code));
        console.log(`   - Codes postaux manquants: ${missingCodes.join(', ')}`);
        
        if (missingCodes.length > 0) {
          console.log('\n🔍 CAUSES POSSIBLES:');
          console.log('   1. Rate limiting Meta API');
          console.log('   2. Timeout des appels Meta API');
          console.log('   3. Erreurs Meta API non gérées');
          console.log('   4. Problème de configuration Vercel');
        }
      }
    } else {
      console.log('✅ Tous les codes postaux ont été traités');
    }

    // 3. Vérifier si le projet est vraiment "completed"
    console.log('\n📋 ÉTAPE 2: Vérification du statut réel...');
    
    if (project.status === 'completed' && project.processed_postal_codes < project.total_postal_codes) {
      console.log('⚠️ INCOHÉRENCE DÉTECTÉE:');
      console.log(`   - Status: ${project.status} (marqué comme terminé)`);
      console.log(`   - Mais seulement ${project.processed_postal_codes}/${project.total_postal_codes} traités`);
      console.log('   - Le projet ne devrait PAS être marqué comme "completed"');
    }

    // 4. Recommandations
    console.log('\n🎯 RECOMMANDATIONS');
    console.log('==================');
    console.log('1. Vérifier les logs Vercel pour voir les erreurs Meta API');
    console.log('2. Relancer le processus de targeting pour traiter les codes manquants');
    console.log('3. Vérifier que tous les codes postaux sont valides aux USA');
    console.log('4. S\'assurer que Meta API a traité tous les codes postaux');

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Lancer le debug
debugMetaAPIProcessing();

