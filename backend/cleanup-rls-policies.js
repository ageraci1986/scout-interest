const { Pool } = require('pg');

async function cleanupRLSPolicies() {
  console.log('🧹 Cleaning up problematic RLS policies...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔌 Connecting to Supabase...');
    const client = await pool.connect();
    console.log('✅ Connected to Supabase');
    
    // 1. Lister toutes les politiques RLS
    console.log('\n📋 Step 1: Listing all RLS policies...');
    const allPolicies = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
    
    console.log('📊 All RLS policies found:', allPolicies.rows.length);
    allPolicies.rows.forEach(row => {
      console.log(`  - ${row.tablename}.${row.policyname}`);
    });
    
    // 2. Supprimer les politiques une par une avec des noms entre guillemets
    console.log('\n📋 Step 2: Removing RLS policies...');
    
    for (const policy of allPolicies.rows) {
      try {
        // Utiliser des guillemets doubles pour échapper les noms avec espaces
        const dropQuery = `DROP POLICY IF EXISTS "${policy.policyname}" ON ${policy.tablename}`;
        await client.query(dropQuery);
        console.log(`✅ Removed policy "${policy.policyname}" from ${policy.tablename}`);
      } catch (error) {
        console.error(`❌ Failed to remove policy "${policy.policyname}":`, error.message);
        
        // Essayer une approche alternative
        try {
          const alternativeQuery = `DROP POLICY IF EXISTS "${policy.policyname}" ON "${policy.tablename}"`;
          await client.query(alternativeQuery);
          console.log(`✅ Removed policy "${policy.policyname}" from "${policy.tablename}" (alternative method)`);
        } catch (altError) {
          console.error(`❌ Alternative method also failed for "${policy.policyname}":`, altError.message);
        }
      }
    }
    
    // 3. Vérifier que toutes les politiques sont supprimées
    console.log('\n📋 Step 3: Verifying all policies are removed...');
    const remainingPolicies = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
    
    if (remainingPolicies.rows.length === 0) {
      console.log('✅ All RLS policies successfully removed!');
    } else {
      console.log('⚠️  Some policies remain:', remainingPolicies.rows.length);
      remainingPolicies.rows.forEach(row => {
        console.log(`  - ${row.tablename}.${row.policyname}`);
      });
    }
    
    // 4. Désactiver RLS sur toutes les tables
    console.log('\n📋 Step 4: Disabling RLS on all tables...');
    const tables = ['projects', 'processing_results', 'file_uploads', 'postal_codes', 'analysis_jobs', 'api_logs'];
    
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
        console.log(`✅ Disabled RLS on ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not disable RLS on ${table}:`, error.message);
      }
    }
    
    // 5. Test final complet
    console.log('\n📋 Step 5: Final comprehensive test...');
    
    try {
      // Test 1: Lecture des projets
      const projectsTest = await client.query(`
        SELECT id, name, user_id, status, created_at
        FROM projects 
        WHERE user_id = 'anonymous' 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('✅ Projects query successful:', projectsTest.rows.length, 'projects');
      projectsTest.rows.forEach((project, index) => {
        console.log(`  - Project ${index + 1}: ${project.name} (ID: ${project.id}, Status: ${project.status})`);
      });
      
      // Test 2: Lecture des résultats pour le premier projet
      if (projectsTest.rows.length > 0) {
        const firstProjectId = projectsTest.rows[0].id;
        const resultsTest = await client.query(`
          SELECT id, postal_code, country_code, success, error_message, processed_at
          FROM processing_results 
          WHERE project_id = $1
          ORDER BY processed_at DESC 
          LIMIT 5
        `, [firstProjectId]);
        
        console.log('✅ Results query successful:', resultsTest.rows.length, 'results for project', firstProjectId);
        resultsTest.rows.forEach((result, index) => {
          console.log(`  - Result ${index + 1}: ${result.postal_code} (${result.country_code}) - Success: ${result.success}`);
        });
      }
      
      // Test 3: Test d'insertion d'un projet de test
      const testProject = await client.query(`
        INSERT INTO projects (name, description, user_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, created_at
      `, ['Test Project - RLS Cleanup', 'Testing after RLS cleanup', 'anonymous', 'active']);
      
      console.log('✅ Test project creation successful:', testProject.rows[0]);
      
      // Nettoyer le projet de test
      await client.query('DELETE FROM projects WHERE id = $1', [testProject.rows[0].id]);
      console.log('✅ Test project cleaned up');
      
    } catch (error) {
      console.error('❌ Final test failed:', error.message);
    }
    
    client.release();
    console.log('\n🎉 RLS policies cleanup completed!');
    
  } catch (error) {
    console.error('❌ RLS cleanup failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécuter le nettoyage
cleanupRLSPolicies().catch(console.error);
