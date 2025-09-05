const { Pool } = require('pg');

class LocalDatabase {
  constructor() {
    // Utiliser Supabase si DATABASE_URL est disponible, sinon PostgreSQL local
    const hasDatabaseUrl = process.env.DATABASE_URL;
    
    if (hasDatabaseUrl) {
      // Configuration Supabase (production ou développement avec DATABASE_URL)
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        },
        max: 2, // Vercel optimization: Max 2 connections per function
        min: 0, // Minimum 0 connections
        idle: 10000, // Close idle connections after 10 seconds
        connectionTimeout: 5000, // 5 second connection timeout
        acquireTimeout: 5000, // 5 second acquire timeout
        allowExitOnIdle: true, // Allow process to exit when all connections are idle
      });
      console.log('✅ Using Supabase database (DATABASE_URL provided)');
    } else {
      // Configuration PostgreSQL local pour le développement sans DATABASE_URL
      this.pool = new Pool({
        host: process.env.DB_HOST || 'postgres',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'scout_interest_db',
        user: process.env.DB_USER || 'scout_user',
        password: process.env.DB_PASSWORD || 'scout_password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      console.log('✅ Using local PostgreSQL database (no DATABASE_URL)');
    }
    
    this.init();
  }

  async init() {
    try {
      // Test connection
      const client = await this.pool.connect();
      console.log('✅ Connected to database');
      client.release();
      
      // Create tables
      await this.createTables();
    } catch (err) {
      console.error('❌ Error connecting to database:', err.message);
      console.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      console.error('❌ NODE_ENV:', process.env.NODE_ENV);
    }
  }

  async createTables() {
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        total_postal_codes INTEGER DEFAULT 0,
        processed_postal_codes INTEGER DEFAULT 0,
        error_postal_codes INTEGER DEFAULT 0,
        targeting_spec JSONB,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createProcessingResultsTable = `
      CREATE TABLE IF NOT EXISTS processing_results (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country_code VARCHAR(10) NOT NULL,
        zip_data TEXT,
        postal_code_only_estimate TEXT,
        postal_code_with_targeting_estimate TEXT,
        targeting_spec TEXT,
        success BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `;

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

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_processing_results_project_id ON processing_results(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_processing_results_postal_code ON processing_results(postal_code)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project_id ON analysis_jobs(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_jobs_job_id ON analysis_jobs(job_id)',
      'CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status)'
    ];

    try {
      await this.run(createProjectsTable);
      console.log('✅ Projects table ready');
      
      await this.run(createProcessingResultsTable);
      console.log('✅ Processing results table ready');
      
      await this.run(createAnalysisJobsTable);
      console.log('✅ Analysis jobs table ready');
      
      // Créer les index séparément
      for (const indexSql of createIndexes) {
        try {
          await this.run(indexSql);
        } catch (indexError) {
          console.log(`⚠️ Index might already exist: ${indexError.message}`);
        }
      }
      console.log('✅ Database indexes ready');
    } catch (err) {
      console.error('❌ Error creating tables:', err.message);
    }
  }

  // Méthodes utilitaires pour les promesses
  async run(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return { 
        id: result.rows[0]?.id, 
        changes: result.rowCount,
        rows: result.rows 
      };
    } finally {
      client.release();
    }
  }

  async get(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async all(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    console.log('✅ Database connection closed');
  }
}

// Instance singleton
const localDatabase = new LocalDatabase();

module.exports = localDatabase;
