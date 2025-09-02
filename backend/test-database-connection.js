#!/usr/bin/env node

require('dotenv').config();
const db = require('./src/config/database');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('📋 Environment:', process.env.NODE_ENV);
  console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'not configured');
  
  try {
    // Test basic connection
    console.log('📋 Testing basic connection...');
    const result = await db.run('SELECT 1 as test');
    console.log('✅ Basic connection test passed:', result);
    
    // Test projects table
    console.log('📋 Testing projects table...');
    const projectsResult = await db.run('SELECT COUNT(*) as count FROM projects');
    console.log('✅ Projects table test passed:', projectsResult);
    
    // Test creating a test project
    console.log('📋 Testing project creation...');
    const createResult = await db.run(`
      INSERT INTO projects (name, description, user_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name
    `, ['Test Project', 'Test Description', 'test-user', 'active']);
    console.log('✅ Project creation test passed:', createResult);
    
    // Clean up test project
    if (createResult.rows[0]) {
      await db.run('DELETE FROM projects WHERE id = $1', [createResult.rows[0].id]);
      console.log('✅ Test project cleaned up');
    }
    
    console.log('🎉 All database tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('❌ Full error:', error);
    process.exit(1);
  }
}

testDatabaseConnection();
