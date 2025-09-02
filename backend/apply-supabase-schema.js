const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applySupabaseSchema() {
  console.log('🔧 Applying Supabase schema...');
  
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
    
    // Lire le fichier de schéma
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Applying schema...');
    
    // Diviser le schéma en commandes individuelles
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`📝 Executing command ${i + 1}/${commands.length}...`);
          await client.query(command);
          console.log(`✅ Command ${i + 1} executed successfully`);
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            console.log(`⚠️  Command ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            console.error(`❌ Command ${i + 1} failed:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Schema applied successfully!');
    
    // Vérifier que les tables existent
    console.log('🔍 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('projects', 'file_uploads', 'processing_results')
      ORDER BY table_name
    `);
    
    const expectedTables = ['projects', 'file_uploads', 'processing_results'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📋 Tables found:', existingTables);
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    client.release();
    console.log('✅ Schema verification completed!');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    console.error('❌ Error details:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
applySupabaseSchema().catch(console.error);
