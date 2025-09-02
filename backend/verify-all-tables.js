const { Pool } = require('pg');

async function verifyAllTables() {
  console.log('🔍 Vérification complète des tables Supabase...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    console.log('💡 Please set your Supabase DATABASE_URL in your environment');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });
  
  try {
    console.log('🔌 Connecting to Supabase...');
    const client = await pool.connect();
    console.log('✅ Connected to Supabase');
    
    // Définir toutes les tables nécessaires
    const requiredTables = [
      {
        name: 'projects',
        sql: `
          CREATE TABLE IF NOT EXISTS projects (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
            description TEXT,
            user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            total_postal_codes INTEGER DEFAULT 0,
            processed_postal_codes INTEGER DEFAULT 0,
            error_postal_codes INTEGER DEFAULT 0,
            targeting_spec JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'file_uploads',
        sql: `
          CREATE TABLE IF NOT EXISTS file_uploads (
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
          )
        `
      },
      {
        name: 'processing_results',
        sql: `
          CREATE TABLE IF NOT EXISTS processing_results (
            id BIGSERIAL PRIMARY KEY,
            project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            postal_code VARCHAR(20) NOT NULL,
            country_code VARCHAR(2) NOT NULL,
            zip_data JSONB,
            postal_code_only_estimate JSONB,
            postal_code_with_targeting_estimate JSONB,
            targeting_spec JSONB,
            success BOOLEAN NOT NULL DEFAULT false,
            error_message TEXT,
            processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'postal_codes',
        sql: `
          CREATE TABLE IF NOT EXISTS postal_codes (
            id BIGSERIAL PRIMARY KEY,
            project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            postal_code VARCHAR(20) NOT NULL,
            country VARCHAR(10) DEFAULT 'FR',
            region VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            audience_interest INTEGER,
            audience_geo INTEGER,
            ratio DECIMAL(5,4),
            meta_interest_id VARCHAR(255),
            meta_interest_name VARCHAR(255),
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'analysis_jobs',
        sql: `
          CREATE TABLE IF NOT EXISTS analysis_jobs (
            id BIGSERIAL PRIMARY KEY,
            project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            job_id VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            progress INTEGER DEFAULT 0,
            total_items INTEGER DEFAULT 0,
            processed_items INTEGER DEFAULT 0,
            failed_items INTEGER DEFAULT 0,
            meta_targeting_spec JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'api_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS api_logs (
            id BIGSERIAL PRIMARY KEY,
            project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
            endpoint VARCHAR(255) NOT NULL,
            method VARCHAR(10) NOT NULL,
            status_code INTEGER,
            response_time INTEGER,
            error_message TEXT,
            meta_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      }
    ];
    
    // Vérifier et créer les tables
    console.log('📋 Checking and creating tables...');
    const createdTables = [];
    const existingTables = [];
    
    for (const table of requiredTables) {
      try {
        // Vérifier si la table existe
        const checkResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table.name]);
        
        if (checkResult.rows[0].exists) {
          console.log(`✅ Table '${table.name}' already exists`);
          existingTables.push(table.name);
        } else {
          console.log(`📝 Creating table '${table.name}'...`);
          await client.query(table.sql);
          console.log(`✅ Table '${table.name}' created successfully`);
          createdTables.push(table.name);
        }
      } catch (error) {
        console.error(`❌ Error with table '${table.name}':`, error.message);
      }
    }
    
    // Créer les index
    console.log('\n📋 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_file_uploads_project_id ON file_uploads(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status)',
      'CREATE INDEX IF NOT EXISTS idx_processing_results_project_id ON processing_results(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_processing_results_postal_code ON processing_results(postal_code)',
      'CREATE INDEX IF NOT EXISTS idx_processing_results_success ON processing_results(success)',
      'CREATE INDEX IF NOT EXISTS idx_postal_codes_project_id ON postal_codes(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_postal_codes_status ON postal_codes(status)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project_id ON analysis_jobs(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status)',
      'CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_projects_targeting_spec ON projects USING GIN (targeting_spec)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        console.log(`✅ Index created: ${indexSql.split(' ')[5]}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Index already exists: ${indexSql.split(' ')[5]}`);
        } else {
          console.error(`❌ Index error: ${error.message}`);
        }
      }
    }
    
    // Créer les fonctions et triggers
    console.log('\n📋 Creating functions and triggers...');
    
    const functionSql = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    
    try {
      await client.query(functionSql);
      console.log('✅ Function update_updated_at_column created');
    } catch (error) {
      console.log('⚠️  Function already exists or error:', error.message);
    }
    
    // Créer les triggers
    const triggers = [
      'CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_postal_codes_updated_at BEFORE UPDATE ON postal_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_analysis_jobs_updated_at BEFORE UPDATE ON analysis_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'
    ];
    
    for (const triggerSql of triggers) {
      try {
        await client.query(triggerSql);
        console.log(`✅ Trigger created: ${triggerSql.split(' ')[2]}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Trigger already exists: ${triggerSql.split(' ')[2]}`);
        } else {
          console.error(`❌ Trigger error: ${error.message}`);
        }
      }
    }
    
    // Vérification finale
    console.log('\n🔍 Final verification...');
    const allTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('projects', 'file_uploads', 'processing_results', 'postal_codes', 'analysis_jobs', 'api_logs')
      ORDER BY table_name
    `);
    
    const foundTables = allTablesResult.rows.map(row => row.table_name);
    const expectedTables = ['projects', 'file_uploads', 'processing_results', 'postal_codes', 'analysis_jobs', 'api_logs'];
    
    console.log('📋 All tables found:', foundTables);
    
    for (const table of expectedTables) {
      if (foundTables.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    // Résumé
    console.log('\n📊 Summary:');
    console.log(`- Created tables: ${createdTables.length} (${createdTables.join(', ')})`);
    console.log(`- Existing tables: ${existingTables.length} (${existingTables.join(', ')})`);
    console.log(`- Total tables: ${foundTables.length}/${expectedTables.length}`);
    
    if (foundTables.length === expectedTables.length) {
      console.log('🎉 All required tables are present!');
    } else {
      console.log('⚠️  Some tables are missing. Check the errors above.');
    }
    
    client.release();
    console.log('✅ Database verification completed!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error('❌ Error details:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
verifyAllTables().catch(console.error);
