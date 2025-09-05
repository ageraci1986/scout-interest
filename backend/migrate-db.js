#!/usr/bin/env node

const { Client } = require('pg');

async function runMigration() {
  console.log('🚀 Starting database migration...');
  
  // Configuration de la base de données avec une seule connexion
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // 1. Add missing columns to projects table
    console.log('📝 Adding missing columns to projects table...');
    
    const addColumns = [
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS targeting_spec JSONB',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP'
    ];
    
    for (const sql of addColumns) {
      try {
        await client.query(sql);
        console.log(`✅ ${sql}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Column already exists: ${sql}`);
        } else {
          throw error;
        }
      }
    }
    
    // 2. Create analysis_jobs table
    console.log('📝 Creating analysis_jobs table...');
    
    const createAnalysisJobsTable = `
      CREATE TABLE IF NOT EXISTS analysis_jobs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        job_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        total_items INTEGER DEFAULT 0,
        processed_items INTEGER DEFAULT 0,
        failed_items INTEGER DEFAULT 0,
        current_batch INTEGER DEFAULT 0,
        batch_size INTEGER DEFAULT 200,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        meta_targeting_spec JSONB,
        last_error TEXT,
        next_retry_at TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;
    
    await client.query(createAnalysisJobsTable);
    console.log('✅ Analysis jobs table created');
    
    // 3. Create indexes
    console.log('📝 Creating indexes...');
    
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project_id ON analysis_jobs(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_jobs_job_id ON analysis_jobs(job_id)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status)'
    ];
    
    for (const indexSql of createIndexes) {
      try {
        await client.query(indexSql);
        console.log(`✅ ${indexSql}`);
      } catch (error) {
        console.log(`⚠️ Index might already exist: ${error.message}`);
      }
    }
    
    // 4. Verify tables
    console.log('🔍 Verifying database structure...');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Tables found:', tables);
    
    // Verify columns in projects table
    const projectsColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Projects table columns:');
    projectsColumnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verify analysis_jobs table
    const jobsColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'analysis_jobs'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Analysis jobs table columns:');
    jobsColumnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };