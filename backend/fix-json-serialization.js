const { Pool } = require('pg');

async function fixJsonSerialization() {
  console.log('🔧 Fixing JSON serialization issue...');
  
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
    
    // 1. Vérifier les résultats récents du projet 8
    console.log('\n📋 Checking recent results from project 8...');
    const recentResults = await client.query(`
      SELECT 
        id,
        project_id,
        postal_code,
        success,
        postal_code_only_estimate,
        postal_code_with_targeting_estimate,
        targeting_spec,
        error_message,
        processed_at
      FROM processing_results 
      WHERE project_id = 8
      ORDER BY processed_at DESC
    `);
    
    console.log(`📊 Found ${recentResults.rows.length} results for project 8`);
    
    if (recentResults.rows.length > 0) {
      recentResults.rows.forEach((row, index) => {
        console.log(`\n📋 Result ${index + 1}:`);
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Postal Code: ${row.postal_code}`);
        console.log(`  - Success: ${row.success}`);
        console.log(`  - Error: ${row.error_message || 'None'}`);
        console.log(`  - Processed: ${row.processed_at}`);
        
        // Vérifier le type des champs JSON
        console.log(`  - postal_code_only_estimate type: ${typeof row.postal_code_only_estimate}`);
        console.log(`  - postal_code_with_targeting_estimate type: ${typeof row.postal_code_with_targeting_estimate}`);
        console.log(`  - targeting_spec type: ${typeof row.targeting_spec}`);
        
        // Afficher un aperçu des données JSON
        if (row.postal_code_only_estimate) {
          console.log(`  - postal_code_only_estimate preview: ${JSON.stringify(row.postal_code_only_estimate).substring(0, 100)}...`);
        }
        
        if (row.postal_code_with_targeting_estimate) {
          console.log(`  - postal_code_with_targeting_estimate preview: ${JSON.stringify(row.postal_code_with_targeting_estimate).substring(0, 100)}...`);
        }
      });
    }
    
    // 2. Vérifier la structure de la table
    console.log('\n📋 Checking table structure...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'processing_results'
      AND data_type = 'jsonb'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 JSONB columns in processing_results:');
    tableStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 3. Tenter de corriger les données JSON mal sérialisées
    console.log('\n🔧 Attempting to fix malformed JSON data...');
    
    const malformedResults = await client.query(`
      SELECT id, postal_code_only_estimate, postal_code_with_targeting_estimate, targeting_spec
      FROM processing_results 
      WHERE project_id = 8
      AND (
        postal_code_only_estimate::text LIKE '%[object Object]%'
        OR postal_code_with_targeting_estimate::text LIKE '%[object Object]%'
        OR targeting_spec::text LIKE '%[object Object]%'
      )
    `);
    
    console.log(`📊 Found ${malformedResults.rows.length} results with malformed JSON`);
    
    if (malformedResults.rows.length > 0) {
      console.log('⚠️  These results contain malformed JSON data that needs to be fixed');
      
      // Tenter de corriger en supprimant les données malformées
      for (const result of malformedResults.rows) {
        try {
          await client.query(`
            UPDATE processing_results 
            SET 
              postal_code_only_estimate = NULL,
              postal_code_with_targeting_estimate = NULL,
              targeting_spec = NULL
            WHERE id = $1
          `, [result.id]);
          
          console.log(`✅ Fixed malformed JSON for result ID ${result.id}`);
        } catch (error) {
          console.error(`❌ Failed to fix result ID ${result.id}:`, error.message);
        }
      }
    }
    
    // 4. Vérifier à nouveau les résultats
    console.log('\n📋 Re-checking results after fix...');
    const fixedResults = await client.query(`
      SELECT 
        id,
        postal_code,
        success,
        postal_code_only_estimate IS NOT NULL as has_only_estimate,
        postal_code_with_targeting_estimate IS NOT NULL as has_targeting_estimate,
        targeting_spec IS NOT NULL as has_targeting_spec
      FROM processing_results 
      WHERE project_id = 8
      ORDER BY processed_at DESC
    `);
    
    console.log('📊 Results after fix:');
    fixedResults.rows.forEach((row, index) => {
      console.log(`  - Result ${index + 1}: ${row.postal_code} (Success: ${row.success})`);
      console.log(`    Has estimates: Only=${row.has_only_estimate}, Targeting=${row.has_targeting_estimate}, Spec=${row.has_targeting_spec}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error fixing JSON serialization:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
fixJsonSerialization().catch(console.error);
