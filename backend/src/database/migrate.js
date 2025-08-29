const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  
  try {
    // Execute all migrations in order
    const migrations = [
      '001_initial_schema.sql',
      '002_add_targeting_spec.sql'
    ];
    
    for (const migrationFile of migrations) {
      console.log(`🔄 Executing migration: ${migrationFile}`);
      const migrationPath = path.join(__dirname, 'migrations', migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split the SQL into individual statements, but handle PL/pgSQL functions properly
      const statements = [];
      const lines = migrationSQL.split('\n');
      let currentStatement = '';
      let inFunction = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip comments
        if (trimmedLine.startsWith('--') || trimmedLine === '') {
          continue;
        }
        
        currentStatement += line + '\n';
        
        // Check if we're entering a function
        if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || trimmedLine.includes('CREATE FUNCTION')) {
          inFunction = true;
        }
        
        // Check if we're ending a function
        if (inFunction && trimmedLine.includes('$$ language') && trimmedLine.includes('plpgsql')) {
          inFunction = false;
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
        
        // Regular statement ending
        if (!inFunction && trimmedLine.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.run(statement);
            console.log('✅ Executed:', statement.substring(0, 50) + '...');
          } catch (error) {
            // Ignore errors for existing tables/columns or missing tables
            if (error.code === '42P07' || error.code === '42710' || error.code === '42P01' || error.message.includes('already exists') || error.message.includes('does not exist')) {
              console.log('ℹ️ Skipped:', statement.substring(0, 50) + '...');
            } else {
              throw error;
            }
          }
        }
      }
    }
    
    console.log('✅ Database migrations completed successfully!');
    
    // Verify tables were created
    const tables = await db.all(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log('📊 Created tables:', tables.map(row => row.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
