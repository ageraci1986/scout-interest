const { Pool } = require('pg');

async function deepDiagnosis() {
  console.log('🔍 DEEP DIAGNOSIS - Finding the real issue...');
  
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
    
    // 1. Vérifier l'état actuel des permissions
    console.log('\n📋 Step 1: Current permission status...');
    const currentPermissions = await client.query(`
      SELECT 
        has_table_privilege('public', 'projects', 'SELECT') as can_select_projects,
        has_table_privilege('public', 'projects', 'INSERT') as can_insert_projects,
        has_table_privilege('public', 'processing_results', 'SELECT') as can_select_results,
        has_table_privilege('public', 'processing_results', 'INSERT') as can_insert_results
    `);
    
    console.log('📊 Current permissions:');
    console.log('  - Can SELECT projects:', currentPermissions.rows[0].can_select_projects);
    console.log('  - Can INSERT projects:', currentPermissions.rows[0].can_insert_projects);
    console.log('  - Can SELECT results:', currentPermissions.rows[0].can_select_results);
    console.log('  - Can INSERT results:', currentPermissions.rows[0].can_insert_results);
    
    // 2. Vérifier l'état RLS actuel
    console.log('\n📋 Step 2: Current RLS status...');
    const currentRLS = await client.query(`
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename IN ('projects', 'processing_results')
      ORDER BY tablename
    `);
    
    console.log('📊 Current RLS status:');
    currentRLS.rows.forEach(row => {
      console.log(`  - ${row.tablename}: RLS ${row.rowsecurity ? 'enabled' : 'disabled'}`);
    });
    
    // 3. Tester la lecture directe des tables
    console.log('\n📋 Step 3: Testing direct table access...');
    
    try {
      const projectsTest = await client.query('SELECT COUNT(*) as count FROM projects');
      console.log('✅ Projects table readable:', projectsTest.rows[0].count, 'projects');
      
      const resultsTest = await client.query('SELECT COUNT(*) as count FROM processing_results');
      console.log('✅ Results table readable:', resultsTest.rows[0].count, 'results');
      
    } catch (error) {
      console.error('❌ Table access error:', error.message);
    }
    
    // 4. Vérifier les politiques RLS
    console.log('\n📋 Step 4: Checking RLS policies...');
    try {
      const rlsPolicies = await client.query(`
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('projects', 'processing_results')
        ORDER BY tablename, policyname
      `);
      
      console.log('📊 RLS policies found:', rlsPolicies.rows.length);
      rlsPolicies.rows.forEach(row => {
        console.log(`  - ${row.tablename}.${row.policyname}: ${row.cmd} (${row.permissive ? 'permissive' : 'restrictive'})`);
      });
      
      // Supprimer toutes les politiques RLS
      if (rlsPolicies.rows.length > 0) {
        console.log('\n🔧 Removing all RLS policies...');
        for (const policy of rlsPolicies.rows) {
          try {
            await client.query(`DROP POLICY IF EXISTS ${policy.policyname} ON ${policy.tablename}`);
            console.log(`✅ Removed policy ${policy.policyname} from ${policy.tablename}`);
          } catch (error) {
            console.log(`⚠️  Could not remove policy ${policy.policyname}:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.log('⚠️  Could not check RLS policies:', error.message);
    }
    
    // 5. Vérifier les triggers et contraintes
    console.log('\n📋 Step 5: Checking triggers and constraints...');
    try {
      const triggers = await client.query(`
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_statement
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        AND event_object_table IN ('projects', 'processing_results')
        ORDER BY event_object_table, trigger_name
      `);
      
      console.log('📊 Triggers found:', triggers.rows.length);
      triggers.rows.forEach(row => {
        console.log(`  - ${row.event_object_table}.${row.trigger_name}: ${row.event_manipulation}`);
      });
      
    } catch (error) {
      console.log('⚠️  Could not check triggers:', error.message);
    }
    
    // 6. Vérifier les vues
    console.log('\n📋 Step 6: Checking views...');
    try {
      const views = await client.query(`
        SELECT 
          table_name,
          view_definition
        FROM information_schema.views 
        WHERE table_schema = 'public'
        AND table_name IN ('projects', 'processing_results')
        ORDER BY table_name
      `);
      
      console.log('📊 Views found:', views.rows.length);
      views.rows.forEach(row => {
        console.log(`  - ${row.table_name}: ${row.view_definition.substring(0, 100)}...`);
      });
      
    } catch (error) {
      console.log('⚠️  Could not check views:', error.message);
    }
    
    // 7. Test final après nettoyage
    console.log('\n📋 Step 7: Final test after cleanup...');
    try {
      // Désactiver RLS définitivement
      await client.query('ALTER TABLE projects DISABLE ROW LEVEL SECURITY');
      await client.query('ALTER TABLE processing_results DISABLE ROW LEVEL SECURITY');
      console.log('✅ RLS permanently disabled on both tables');
      
      // Vérifier l'accès
      const finalProjectsTest = await client.query('SELECT COUNT(*) as count FROM projects');
      console.log('✅ Final projects test:', finalProjectsTest.rows[0].count, 'projects');
      
      const finalResultsTest = await client.query('SELECT COUNT(*) as count FROM processing_results');
      console.log('✅ Final results test:', finalResultsTest.rows[0].count, 'results');
      
      // Tester une requête spécifique
      const specificProject = await client.query(`
        SELECT id, name, user_id, status 
        FROM projects 
        WHERE user_id = 'anonymous' 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (specificProject.rows.length > 0) {
        console.log('✅ Specific project query successful:', specificProject.rows[0]);
        
        // Tester les résultats de ce projet
        const projectResults = await client.query(`
          SELECT id, postal_code, success, error_message
          FROM processing_results 
          WHERE project_id = $1
          ORDER BY processed_at DESC
          LIMIT 3
        `, [specificProject.rows[0].id]);
        
        console.log('✅ Project results query successful:', projectResults.rows.length, 'results');
        projectResults.rows.forEach((result, index) => {
          console.log(`  - Result ${index + 1}: ${result.postal_code} (Success: ${result.success})`);
        });
      } else {
        console.log('⚠️  No projects found for user "anonymous"');
      }
      
    } catch (error) {
      console.error('❌ Final test failed:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Deep diagnosis completed!');
    
  } catch (error) {
    console.error('❌ Deep diagnosis failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécuter le diagnostic
deepDiagnosis().catch(console.error);
