const { Pool } = require('pg');

async function fixDBPermissions() {
  console.log('🔧 Fixing database permissions...');
  
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
    
    // 1. Vérifier l'utilisateur actuel
    console.log('\n📋 Step 1: Checking current user...');
    const currentUser = await client.query('SELECT current_user, session_user');
    console.log('📊 Current user:', currentUser.rows[0]);
    
    // 2. Vérifier le schéma actuel
    console.log('\n📋 Step 2: Checking current schema...');
    const currentSchema = await client.query('SELECT current_schema()');
    console.log('📊 Current schema:', currentSchema.rows[0].current_schema);
    
    // 3. Vérifier les permissions sur le schéma public
    console.log('\n📋 Step 3: Checking schema permissions...');
    const schemaPermissions = await client.query(`
      SELECT 
        has_schema_privilege('public', 'USAGE') as can_use_public,
        has_schema_privilege('public', 'CREATE') as can_create_in_public
    `);
    
    console.log('📊 Schema permissions:');
    console.log('  - Can USE public schema:', schemaPermissions.rows[0].can_use_public);
    console.log('  - Can CREATE in public schema:', schemaPermissions.rows[0].can_create_in_public);
    
    // 4. Vérifier les permissions sur les tables
    console.log('\n📋 Step 4: Checking table permissions...');
    const tablePermissions = await client.query(`
      SELECT 
        table_name,
        has_table_privilege('public', table_name, 'SELECT') as can_select,
        has_table_privilege('public', table_name, 'INSERT') as can_insert,
        has_table_privilege('public', table_name, 'UPDATE') as can_update,
        has_table_privilege('public', table_name, 'DELETE') as can_delete
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 Table permissions:');
    tablePermissions.rows.forEach(row => {
      console.log(`  - ${row.table_name}:`);
      console.log(`    SELECT: ${row.can_select ? '✅' : '❌'}`);
      console.log(`    INSERT: ${row.can_insert ? '✅' : '❌'}`);
      console.log(`    UPDATE: ${row.can_update ? '✅' : '❌'}`);
      console.log(`    DELETE: ${row.can_delete ? '✅' : '❌'}`);
    });
    
    // 5. Tenter de corriger les permissions
    console.log('\n📋 Step 5: Attempting to fix permissions...');
    
    try {
      // Essayer de donner les permissions sur le schéma public
      await client.query('GRANT USAGE ON SCHEMA public TO public');
      console.log('✅ Granted USAGE on public schema');
    } catch (error) {
      console.log('⚠️  Could not grant schema permissions:', error.message);
    }
    
    try {
      // Essayer de donner les permissions sur toutes les tables
      const tables = ['projects', 'processing_results', 'file_uploads', 'postal_codes', 'analysis_jobs', 'api_logs'];
      
      for (const table of tables) {
        try {
          await client.query(`GRANT ALL PRIVILEGES ON TABLE ${table} TO public`);
          console.log(`✅ Granted ALL privileges on ${table}`);
        } catch (error) {
          console.log(`⚠️  Could not grant privileges on ${table}:`, error.message);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not grant table permissions:', error.message);
    }
    
    // 6. Vérifier les permissions après correction
    console.log('\n📋 Step 6: Checking permissions after fix...');
    const fixedPermissions = await client.query(`
      SELECT 
        has_table_privilege('public', 'projects', 'SELECT') as can_select_projects,
        has_table_privilege('public', 'projects', 'INSERT') as can_insert_projects,
        has_table_privilege('public', 'processing_results', 'SELECT') as can_select_results,
        has_table_privilege('public', 'processing_results', 'INSERT') as can_insert_results
    `);
    
    console.log('📊 Permissions after fix:');
    console.log('  - Can SELECT projects:', fixedPermissions.rows[0].can_select_projects);
    console.log('  - Can INSERT projects:', fixedPermissions.rows[0].can_insert_projects);
    console.log('  - Can SELECT results:', fixedPermissions.rows[0].can_select_results);
    console.log('  - Can INSERT results:', fixedPermissions.rows[0].can_insert_results);
    
    // 7. Test de lecture après correction
    if (fixedPermissions.rows[0].can_select_projects) {
      console.log('\n📋 Step 7: Testing read access after fix...');
      try {
        const testRead = await client.query('SELECT COUNT(*) as count FROM projects');
        console.log('✅ Can read projects:', testRead.rows[0].count, 'projects');
        
        const testResults = await client.query('SELECT COUNT(*) as count FROM processing_results');
        console.log('✅ Can read results:', testResults.rows[0].count, 'results');
        
      } catch (error) {
        console.error('❌ Still cannot read after fix:', error.message);
      }
    }
    
    // 8. Alternative : Vérifier si c'est un problème de RLS (Row Level Security)
    console.log('\n📋 Step 8: Checking Row Level Security...');
    try {
      const rlsStatus = await client.query(`
        SELECT 
          schemaname,
          tablename,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);
      
      console.log('📊 RLS status:');
      rlsStatus.rows.forEach(row => {
        console.log(`  - ${row.tablename}: RLS ${row.rowsecurity ? 'enabled' : 'disabled'}`);
      });
      
      // Si RLS est activé, essayer de le désactiver temporairement
      const tablesWithRLS = rlsStatus.rows.filter(row => row.rowsecurity);
      if (tablesWithRLS.length > 0) {
        console.log('⚠️  RLS is enabled on some tables, this might be blocking access');
        
        for (const table of tablesWithRLS) {
          try {
            await client.query(`ALTER TABLE ${table.tablename} DISABLE ROW LEVEL SECURITY`);
            console.log(`✅ Disabled RLS on ${table.tablename}`);
          } catch (error) {
            console.log(`⚠️  Could not disable RLS on ${table.tablename}:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.log('⚠️  Could not check RLS status:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Database permissions fix completed!');
    
  } catch (error) {
    console.error('❌ Permissions fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
fixDBPermissions().catch(console.error);
