#!/usr/bin/env node

// Test direct de la base de données pour voir si les tables existent
const { createClient } = require('@supabase/supabase-js');

async function testDatabase() {
  console.log('🔍 Testing database structure...');
  
  // Load environment variables
  require('dotenv').config({ path: '../.env.production' });
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
    return;
  }
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  try {
    // Test 1: Check projects table
    console.log('📋 Testing projects table...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (projectsError) {
      console.error('❌ Projects table error:', projectsError);
    } else {
      console.log('✅ Projects table OK, sample count:', projects.length);
    }
    
    // Test 2: Check processing_results table
    console.log('📋 Testing processing_results table...');
    const { data: results, error: resultsError } = await supabase
      .from('processing_results')
      .select('*')
      .limit(1);
      
    if (resultsError) {
      console.error('❌ Processing results table error:', resultsError);
    } else {
      console.log('✅ Processing results table OK, sample count:', results.length);
    }
    
    // Test 3: Check analysis_jobs table (CRITICAL)
    console.log('📋 Testing analysis_jobs table...');
    const { data: jobs, error: jobsError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .limit(1);
      
    if (jobsError) {
      console.error('❌ Analysis jobs table error:', jobsError);
      console.error('Error details:', jobsError);
    } else {
      console.log('✅ Analysis jobs table OK, sample count:', jobs.length);
    }
    
    // Test 4: Check table structure
    console.log('📋 Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'analysis_jobs' })
      .single();
      
    if (tableError) {
      console.log('⚠️ Could not get table structure (this is normal if function does not exist)');
    } else {
      console.log('📋 Table structure:', tableInfo);
    }
    
    console.log('✅ Database test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();