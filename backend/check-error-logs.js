const { Pool } = require('pg');

async function checkErrorLogs() {
  console.log('🔍 Checking error logs in database...');
  
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
    
    // 1. Vérifier la table processing_results
    console.log('\n📋 Checking processing_results table...');
    const resultsQuery = await client.query(`
      SELECT 
        id,
        project_id,
        postal_code,
        success,
        error_message,
        created_at
      FROM processing_results 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Found ${resultsQuery.rows.length} processing results`);
    
    if (resultsQuery.rows.length > 0) {
      resultsQuery.rows.forEach((row, index) => {
        console.log(`\n📋 Result ${index + 1}:`);
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Project ID: ${row.project_id}`);
        console.log(`  - Postal Code: ${row.postal_code}`);
        console.log(`  - Success: ${row.success}`);
        console.log(`  - Error: ${row.error_message || 'None'}`);
        console.log(`  - Created: ${row.created_at}`);
      });
    }
    
    // 2. Vérifier la table api_logs
    console.log('\n📋 Checking api_logs table...');
    const apiLogsQuery = await client.query(`
      SELECT 
        id,
        project_id,
        endpoint,
        method,
        status_code,
        error_message,
        created_at
      FROM api_logs 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Found ${apiLogsQuery.rows.length} API logs`);
    
    if (apiLogsQuery.rows.length > 0) {
      apiLogsQuery.rows.forEach((row, index) => {
        console.log(`\n📋 API Log ${index + 1}:`);
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Project ID: ${row.project_id || 'N/A'}`);
        console.log(`  - Endpoint: ${row.endpoint}`);
        console.log(`  - Method: ${row.method}`);
        console.log(`  - Status: ${row.status_code || 'N/A'}`);
        console.log(`  - Error: ${row.error_message || 'None'}`);
        console.log(`  - Created: ${row.created_at}`);
      });
    }
    
    // 3. Vérifier les projets récents
    console.log('\n📋 Checking recent projects...');
    const projectsQuery = await client.query(`
      SELECT 
        id,
        name,
        status,
        total_postal_codes,
        processed_postal_codes,
        error_postal_codes,
        created_at
      FROM projects 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📊 Found ${projectsQuery.rows.length} projects`);
    
    if (projectsQuery.rows.length > 0) {
      projectsQuery.rows.forEach((row, index) => {
        console.log(`\n📋 Project ${index + 1}:`);
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Name: ${row.name}`);
        console.log(`  - Status: ${row.status}`);
        console.log(`  - Total: ${row.total_postal_codes || 0}`);
        console.log(`  - Processed: ${row.processed_postal_codes || 0}`);
        console.log(`  - Errors: ${row.error_postal_codes || 0}`);
        console.log(`  - Created: ${row.created_at}`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking logs:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
checkErrorLogs().catch(console.error);
