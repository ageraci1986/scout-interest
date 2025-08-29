const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

class LocalDatabase {
  constructor() {
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
    
    this.init();
  }

  async init() {
    try {
      // Test connection
      const client = await this.pool.connect();
      console.log('✅ Connected to PostgreSQL database');
      client.release();
      
      // Create tables
      await this.createTables();
    } catch (err) {
      console.error('❌ Error connecting to database:', err.message);
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

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_processing_results_project_id ON processing_results(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_processing_results_postal_code ON processing_results(postal_code)'
    ];

    try {
      await this.run(createProjectsTable);
      console.log('✅ Projects table ready');
      
      await this.run(createProcessingResultsTable);
      console.log('✅ Processing results table ready');
      
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
