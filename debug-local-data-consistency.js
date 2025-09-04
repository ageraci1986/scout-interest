const { createClient } = require('@supabase/supabase-js');

async function debugLocalDataConsistency() {
  console.log('🔍 DEBUG LOCAL DE LA COHÉRENCE DES DONNÉES');
  console.log('==========================================');

  try {
    // Configuration Supabase - variables hardcodées pour le debug
    const supabaseUrl = 'https://wnugqzgzzwmebjjsfrns.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudWdxemd6endtZWJqanNmcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzM5NjIsImV4cCI6MjA3MjUwOTk2Mn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Variables d\'environnement Supabase manquantes');
      console.log('   - SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
      console.log('   - SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connexion Supabase établie');

    // 1. Récupérer tous les projets
    console.log('\n📋 ÉTAPE 1: Récupération de tous les projets...');
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw projectsError;
    }

    console.log(`📊 Nombre total de projets: ${projects.length}`);
    
    if (projects.length === 0) {
      console.log('❌ Aucun projet trouvé');
      return;
    }

    // 2. Analyser le dernier projet
    const latestProject = projects[0];
    console.log(`\n🏆 DERNIER PROJET IDENTIFIÉ:`);
    console.log(`   - ID: ${latestProject.id}`);
    console.log(`   - Nom: ${latestProject.name}`);
    console.log(`   - Créé le: ${latestProject.created_at}`);
    console.log(`   - Status: ${latestProject.status}`);
    console.log(`   - Total codes postaux: ${latestProject.total_postal_codes}`);

    // 3. Récupérer les résultats de traitement du dernier projet
    console.log('\n📋 ÉTAPE 2: Récupération des résultats de traitement...');
    
    const { data: results, error: resultsError } = await supabase
      .from('processing_results')
      .select('*')
      .eq('project_id', latestProject.id)
      .order('processed_at', { ascending: true });

    if (resultsError) {
      throw resultsError;
    }

    console.log(`📊 Résultats de traitement disponibles: ${results.length}`);
    
    if (results.length > 0) {
      console.log('\n📋 RÉSULTATS DÉTAILLÉS:');
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. Code postal: ${result.postal_code}`);
        console.log(`      - Success: ${result.success}`);
        console.log(`      - Estimation géo: ${result.postal_code_only_estimate?.audience_size || 'N/A'}`);
        console.log(`      - Estimation targeting: ${result.postal_code_with_targeting_estimate?.audience_size || 'N/A'}`);
        console.log(`      - Traité le: ${result.processed_at}`);
      });
    }

    // 4. Rechercher des projets avec des codes postaux français
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

    // 5. Vérifier la cohérence des données
    console.log('\n🔍 ANALYSE DE COHÉRENCE');
    console.log('=========================');
    
    const expectedCodes = latestProject.postal_codes || [];
    const actualResults = results.map(r => r.postal_code);
    
    console.log(`📤 Codes postaux attendus (dans le projet): ${expectedCodes.join(', ')}`);
    console.log(`📊 Codes postaux dans les résultats: ${actualResults.join(', ')}`);
    
    if (expectedCodes.length === 0) {
      console.log('⚠️ ATTENTION: Aucun code postal défini dans le projet !');
    }
    
    if (actualResults.length === 0) {
      console.log('⚠️ ATTENTION: Aucun résultat disponible !');
    }

    // 6. Vérifier si Meta API a été appelée
    console.log('\n📋 ÉTAPE 3: Vérification du traitement Meta API...');
    
    const hasMetaEstimates = results.some(result => 
      result.postal_code_only_estimate?.audience_size > 0 ||
      result.postal_code_with_targeting_estimate?.audience_size > 0
    );
    
    if (hasMetaEstimates) {
      console.log('✅ Meta API a été appelée et a retourné des estimations');
    } else {
      console.log('❌ Meta API n\'a pas été appelée ou n\'a pas retourné d\'estimations');
      console.log('   - Toutes les estimations sont à 0 ou null');
    }

    // 7. Conclusion
    console.log('\n🎯 CONCLUSION');
    console.log('==============');
    
    if (expectedCodes.length > 0 && actualResults.length > 0) {
      const allMatch = expectedCodes.every(code => actualResults.includes(code));
      
      if (allMatch) {
        console.log('✅ COHÉRENCE PARFAITE: Tous les codes postaux correspondent');
        console.log('   - Le problème n\'est PAS dans la base de données');
        console.log('   - Le problème est dans l\'interface frontend');
      } else {
        console.log('❌ PROBLÈME DE COHÉRENCE DÉTECTÉ !');
        
        const missingInResults = expectedCodes.filter(code => !actualResults.includes(code));
        const extraInResults = actualResults.filter(code => !expectedCodes.includes(code));
        
        if (missingInResults.length > 0) {
          console.log(`   - Manquants dans les résultats: ${missingInResults.join(', ')}`);
        }
        if (extraInResults.length > 0) {
          console.log(`   - Supplémentaires dans les résultats: ${extraInResults.join(', ')}`);
        }
      }
    } else {
      console.log('⚠️ Impossible de vérifier la cohérence - données manquantes');
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
  }
}

// Lancer le debug
debugLocalDataConsistency();
