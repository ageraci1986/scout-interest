const { Pool } = require('pg');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('💡 Please set DATABASE_URL in your .env file');
    return;
  }
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Test connection
    console.log('🔗 Connecting to Supabase...');
    const client = await pool.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test query
    console.log('📊 Testing database query...');
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database query successful!');
    console.log('🕐 Current time:', result.rows[0].current_time);
    console.log('📋 PostgreSQL version:', result.rows[0].postgres_version.split(' ')[0]);
    
    // Check if tables exist
    console.log('📋 Checking if tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('projects', 'processing_results')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 2) {
      console.log('✅ All tables exist:', tablesResult.rows.map(row => row.table_name));
    } else {
      console.log('⚠️  Some tables are missing:', tablesResult.rows.map(row => row.table_name));
      console.log('💡 Please run the supabase-schema.sql script in Supabase SQL Editor');
    }
    
    // Test projects table
    console.log('📊 Testing projects table...');
    const projectsResult = await client.query('SELECT COUNT(*) as count FROM projects');
    console.log(`✅ Projects table has ${projectsResult.rows[0].count} records`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
    console.log('💡 Please check:');
    console.log('   - DATABASE_URL is correct');
    console.log('   - Supabase project is active');
    console.log('   - Network connection is working');
  } finally {
    await pool.end();
  }
}

// Run the test
testSupabaseConnection();
