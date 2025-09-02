const { Pool } = require('pg');

async function checkRecentErrors() {
  console.log('🔍 Checking recent errors...');
  
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
    
    // 1. Vérifier les résultats récents avec erreurs
    console.log('\n📋 Checking recent processing results with errors...');
    const errorResults = await client.query(`
      SELECT 
        id,
        project_id,
        postal_code,
        country_code,
        success,
        error_message,
        processed_at
      FROM processing_results 
      WHERE success = false
      ORDER BY processed_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Found ${errorResults.rows.length} error results`);
    
    if (errorResults.rows.length > 0) {
      errorResults.rows.forEach((row, index) => {
        console.log(`\n📋 Error Result ${index + 1}:`);
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Project ID: ${row.project_id}`);
        console.log(`  - Postal Code: ${row.postal_code}`);
        console.log(`  - Country: ${row.country_code}`);
        console.log(`  - Error: ${row.error_message || 'No error message'}`);
        console.log(`  - Processed: ${row.processed_at}`);
      });
    }
    
    // 2. Vérifier les projets récents
    console.log('\n📋 Checking recent projects...');
    const recentProjects = await client.query(`
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
    
    console.log(`📊 Found ${recentProjects.rows.length} recent projects`);
    
    if (recentProjects.rows.length > 0) {
      for (let i = 0; i < recentProjects.rows.length; i++) {
        const row = recentProjects.rows[i];
        console.log(`\n📋 Project ${i + 1}:`);
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Name: ${row.name}`);
        console.log(`  - Status: ${row.status}`);
        console.log(`  - Total: ${row.total_postal_codes || 0}`);
        console.log(`  - Processed: ${row.processed_postal_codes || 0}`);
        console.log(`  - Errors: ${row.error_postal_codes || 0}`);
        console.log(`  - Created: ${row.created_at}`);
        
        // Vérifier les résultats de ce projet
        if (row.id) {
          const projectResults = await client.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN success = true THEN 1 END) as successful,
              COUNT(CASE WHEN success = false THEN 1 END) as failed
            FROM processing_results 
            WHERE project_id = $1
          `, [row.id]);
          
          if (projectResults.rows.length > 0) {
            const stats = projectResults.rows[0];
            console.log(`  - DB Stats: ${stats.total} total, ${stats.successful} success, ${stats.failed} failed`);
          }
        }
      }
    }
    
    // 3. Vérifier les logs API récents
    console.log('\n📋 Checking recent API logs...');
    const apiLogs = await client.query(`
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
    
    console.log(`📊 Found ${apiLogs.rows.length} API logs`);
    
    if (apiLogs.rows.length > 0) {
      apiLogs.rows.forEach((row, index) => {
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
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking recent errors:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
checkRecentErrors().catch(console.error);
