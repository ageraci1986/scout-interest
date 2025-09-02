const { Pool } = require('pg');

async function checkTableStructure() {
  console.log('🔍 Checking table structure...');
  
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
    
    // 1. Vérifier la structure de processing_results
    console.log('\n📋 Checking processing_results table structure...');
    const resultsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'processing_results'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 processing_results columns:');
    resultsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 2. Vérifier la structure de api_logs
    console.log('\n📋 Checking api_logs table structure...');
    const apiLogsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'api_logs'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 api_logs columns:');
    apiLogsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 3. Vérifier la structure de projects
    console.log('\n📋 Checking projects table structure...');
    const projectsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 projects columns:');
    projectsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 4. Vérifier le contenu de processing_results
    console.log('\n📋 Checking processing_results content...');
    const resultsContent = await client.query(`
      SELECT * FROM processing_results LIMIT 3
    `);
    
    console.log(`📊 Found ${resultsContent.rows.length} processing results`);
    if (resultsContent.rows.length > 0) {
      console.log('📋 Sample result:', resultsContent.rows[0]);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
checkTableStructure().catch(console.error);
