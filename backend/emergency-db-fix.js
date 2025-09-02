const { Pool } = require('pg');

async function emergencyDBFix() {
  console.log('🚨 EMERGENCY DATABASE DIAGNOSIS AND FIX...');
  
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
    
    // 1. Vérifier la connexion de base
    console.log('\n📋 Step 1: Basic connection test...');
    const connectionTest = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection OK:', connectionTest.rows[0].current_time);
    
    // 2. Lister toutes les tables
    console.log('\n📋 Step 2: Listing all tables...');
    const tablesQuery = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Found tables:');
    tablesQuery.rows.forEach(row => {
      console.log(`  - ${row.table_name} (${row.table_type})`);
    });
    
    // 3. Vérifier la table projects
    console.log('\n📋 Step 3: Checking projects table...');
    try {
      const projectsCount = await client.query('SELECT COUNT(*) as count FROM projects');
      console.log('✅ Projects table accessible:', projectsCount.rows[0].count, 'projects');
      
      // Vérifier la structure
      const projectsStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'projects'
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Projects table structure:');
      projectsStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } catch (error) {
      console.error('❌ Projects table error:', error.message);
      
      // Tenter de recréer la table si elle est corrompue
      console.log('🔧 Attempting to recreate projects table...');
      await client.query(`
        DROP TABLE IF EXISTS projects CASCADE;
      `);
      
      await client.query(`
        CREATE TABLE projects (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          user_id VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          total_postal_codes INTEGER DEFAULT 0,
          processed_postal_codes INTEGER DEFAULT 0,
          error_postal_codes INTEGER DEFAULT 0,
          targeting_spec JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ Projects table recreated');
    }
    
    // 4. Vérifier la table processing_results
    console.log('\n📋 Step 4: Checking processing_results table...');
    try {
      const resultsCount = await client.query('SELECT COUNT(*) as count FROM processing_results');
      console.log('✅ Processing results table accessible:', resultsCount.rows[0].count, 'results');
    } catch (error) {
      console.error('❌ Processing results table error:', error.message);
      
      console.log('🔧 Attempting to recreate processing_results table...');
      await client.query(`
        DROP TABLE IF EXISTS processing_results CASCADE;
      `);
      
      await client.query(`
        CREATE TABLE processing_results (
          id BIGSERIAL PRIMARY KEY,
          project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          postal_code VARCHAR(20) NOT NULL,
          country_code VARCHAR(10) NOT NULL,
          zip_data JSONB,
          postal_code_only_estimate JSONB,
          postal_code_with_targeting_estimate JSONB,
          targeting_spec JSONB,
          success BOOLEAN NOT NULL DEFAULT false,
          error_message TEXT,
          processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ Processing results table recreated');
    }
    
    // 5. Vérifier la table file_uploads
    console.log('\n📋 Step 5: Checking file_uploads table...');
    try {
      const uploadsCount = await client.query('SELECT COUNT(*) as count FROM file_uploads');
      console.log('✅ File uploads table accessible:', uploadsCount.rows[0].count, 'uploads');
    } catch (error) {
      console.error('❌ File uploads table error:', error.message);
      
      console.log('🔧 Attempting to recreate file_uploads table...');
      await client.query(`
        DROP TABLE IF EXISTS file_uploads CASCADE;
      `);
      
      await client.query(`
        CREATE TABLE file_uploads (
          id BIGSERIAL PRIMARY KEY,
          project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          upload_path TEXT NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          validation_errors JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ File uploads table recreated');
    }
    
    // 6. Créer les index et contraintes
    console.log('\n📋 Step 6: Creating indexes and constraints...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
        CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        CREATE INDEX IF NOT EXISTS idx_projects_targeting_spec ON projects USING GIN (targeting_spec);
        
        CREATE INDEX IF NOT EXISTS idx_processing_results_project_id ON processing_results(project_id);
        CREATE INDEX IF NOT EXISTS idx_processing_results_postal_code ON processing_results(postal_code);
        
        CREATE INDEX IF NOT EXISTS idx_file_uploads_project_id ON file_uploads(project_id);
        CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status);
      `);
      
      console.log('✅ Indexes and constraints created');
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
    }
    
    // 7. Vérifier les permissions
    console.log('\n📋 Step 7: Checking permissions...');
    try {
      const permissionsTest = await client.query(`
        SELECT 
          has_table_privilege('public', 'projects', 'SELECT') as can_select_projects,
          has_table_privilege('public', 'projects', 'INSERT') as can_insert_projects,
          has_table_privilege('public', 'processing_results', 'SELECT') as can_select_results,
          has_table_privilege('public', 'processing_results', 'INSERT') as can_insert_results
      `);
      
      console.log('📊 Permissions check:');
      console.log('  - Can SELECT projects:', permissionsTest.rows[0].can_select_projects);
      console.log('  - Can INSERT projects:', permissionsTest.rows[0].can_insert_projects);
      console.log('  - Can SELECT results:', permissionsTest.rows[0].can_select_results);
      console.log('  - Can INSERT results:', permissionsTest.rows[0].can_insert_results);
      
    } catch (error) {
      console.error('❌ Error checking permissions:', error.message);
    }
    
    // 8. Test de création d'un projet
    console.log('\n📋 Step 8: Testing project creation...');
    try {
      const testProject = await client.query(`
        INSERT INTO projects (name, description, user_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, created_at
      `, ['Test Project', 'Emergency fix test', 'anonymous', 'active']);
      
      console.log('✅ Test project created:', testProject.rows[0]);
      
      // Nettoyer le projet de test
      await client.query('DELETE FROM projects WHERE id = $1', [testProject.rows[0].id]);
      console.log('✅ Test project cleaned up');
      
    } catch (error) {
      console.error('❌ Error creating test project:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Emergency database fix completed!');
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
emergencyDBFix().catch(console.error);
