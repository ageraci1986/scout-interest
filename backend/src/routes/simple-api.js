const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/projects - List all projects
router.get('/projects', async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, postal_codes, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Projects fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
    
    res.json(projects || []);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id - Get project with results
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (projectError) {
      console.error('Project fetch error:', projectError);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get results
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*')
      .eq('project_id', id)
      .order('postal_code');
    
    if (resultsError) {
      console.error('Results fetch error:', resultsError);
    }
    
    // Combine data
    const response = {
      ...project,
      results: results || []
    };
    
    res.json(response);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/meta/analyze - Start Meta API analysis
router.post('/meta/analyze', async (req, res) => {
  try {
    const { projectId, postalCodes, targeting } = req.body;
    
    if (!projectId || !postalCodes || !Array.isArray(postalCodes)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update project with targeting spec
    await supabase
      .from('projects')
      .update({ targeting_spec: targeting })
      .eq('id', projectId);
    
    // Create result entries for each postal code
    const resultEntries = postalCodes.map(postalCode => ({
      project_id: projectId,
      postal_code: postalCode,
      status: 'pending'
    }));
    
    // Insert or update results
    for (const entry of resultEntries) {
      // Check if result already exists
      const { data: existing } = await supabase
        .from('results')
        .select('id')
        .eq('project_id', projectId)
        .eq('postal_code', entry.postal_code)
        .single();
      
      if (existing) {
        // Update existing result
        await supabase
          .from('results')
          .update({ status: 'pending', error_message: null })
          .eq('id', existing.id);
      } else {
        // Insert new result
        await supabase
          .from('results')
          .insert(entry);
      }
    }
    
    // Process results immediately (simple version without jobs)
    console.log('🚀 Starting Meta API processing for', postalCodes.length, 'postal codes');
    
    // Process in background without blocking response
    processMetaAnalysis(projectId, postalCodes, targeting).catch(error => {
      console.error('Background processing error:', error);
    });
    
    res.json({ 
      message: 'Analysis started', 
      projectId, 
      postalCodesCount: postalCodes.length 
    });
    
  } catch (error) {
    console.error('Meta analyze error:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// Background processing function
async function processMetaAnalysis(projectId, postalCodes, targeting) {
  const { getGeoAudience, getTargetingAudience } = require('../services/meta-api');
  
  // Extract country code from targeting configuration
  let countryCode = 'US'; // Default fallback
  
  if (targeting) {
    // Check various possible locations for country code in targeting spec
    if (targeting.geo_locations?.countries && targeting.geo_locations.countries.length > 0) {
      countryCode = targeting.geo_locations.countries[0];
    } else if (targeting.geo_locations?.country_groups && targeting.geo_locations.country_groups.includes('worldwide')) {
      countryCode = 'US'; // Default for worldwide
    } else if (targeting.country_code) {
      countryCode = targeting.country_code;
    } else if (targeting.geo_locations?.zips && targeting.geo_locations.zips.length > 0) {
      // Extract from existing zip key format (US:90210 -> US)
      const existingKey = targeting.geo_locations.zips[0].key;
      if (existingKey && existingKey.includes(':')) {
        countryCode = existingKey.split(':')[0];
      }
    }
  }
  console.log(`🌍 Using country code: ${countryCode} for project ${projectId}`);
  
  for (const postalCode of postalCodes) {
    try {
      console.log(`📍 Processing ${postalCode} in ${countryCode}...`);
      
      // Update status to processing
      await supabase
        .from('results')
        .update({ status: 'processing' })
        .eq('project_id', projectId)
        .eq('postal_code', postalCode);
      
      // Get geo audience
      const geoAudience = await getGeoAudience(postalCode, countryCode);
      
      // Get targeting audience
      const targetingAudience = await getTargetingAudience(postalCode, targeting, countryCode);
      
      // Update result
      await supabase
        .from('results')
        .update({
          geo_audience: geoAudience,
          targeting_audience: targetingAudience,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('postal_code', postalCode);
      
      console.log(`✅ Completed ${postalCode}: geo=${geoAudience}, targeting=${targetingAudience}`);
      
      // Small delay to avoid rate limiting (reduced for better performance)
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Error processing ${postalCode}:`, error);
      
      // Update result with error
      await supabase
        .from('results')
        .update({
          status: 'error',
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('postal_code', postalCode);
    }
  }
  
  console.log(`🎉 Completed processing for project ${projectId}`);
}

// DELETE /api/projects/:id - Delete project and all related data
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting project:', id);
    
    // Delete all results first (foreign key constraint)
    const { error: resultsError } = await supabase
      .from('results')
      .delete()
      .eq('project_id', id);
    
    if (resultsError) {
      console.error('Results deletion error:', resultsError);
      return res.status(500).json({ error: 'Failed to delete project results' });
    }
    
    // Delete the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (projectError) {
      console.error('Project deletion error:', projectError);
      return res.status(500).json({ error: 'Failed to delete project' });
    }
    
    console.log('✅ Project deleted successfully:', project?.name);
    res.json({ success: true, message: 'Project deleted successfully', project });
    
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/projects/:id - Update project (for targeting configuration)
router.patch('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { targeting_spec } = req.body;
    
    console.log('📝 Updating project:', id, 'with targeting spec');
    
    if (!targeting_spec) {
      return res.status(400).json({ error: 'targeting_spec is required' });
    }
    
    // Update project with targeting spec
    const { data: project, error } = await supabase
      .from('projects')
      .update({ targeting_spec })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Project update error:', error);
      return res.status(500).json({ error: 'Failed to update project' });
    }
    
    console.log('✅ Project updated successfully');
    res.json({ success: true, project });
    
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/jobs/start - Start processing job (simplified)
router.post('/jobs/start', async (req, res) => {
  try {
    const { projectId, targetingSpec } = req.body;
    
    console.log('🚀 Starting processing job for project:', projectId);
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectError || !project) {
      console.error('Project not found:', projectError);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (!project.postal_codes || project.postal_codes.length === 0) {
      return res.status(400).json({ error: 'No postal codes found in project' });
    }
    
    console.log('📊 Found project with', project.postal_codes.length, 'postal codes');
    
    // Start background processing immediately (no job queue)
    const finalTargetingSpec = targetingSpec || project.targeting_spec || {};
    processMetaAnalysis(projectId, project.postal_codes, finalTargetingSpec).catch(error => {
      console.error('Background processing error:', error);
    });
    
    // Return immediate success (fire and forget)
    const response = {
      success: true,
      message: 'Processing started',
      jobId: `job_${projectId}_${Date.now()}`, // Fake job ID for compatibility
      projectId: projectId,
      postalCodesCount: project.postal_codes.length
    };
    
    console.log('✅ Job started successfully');
    res.json(response);
    
  } catch (error) {
    console.error('Start job error:', error);
    res.status(500).json({ error: 'Failed to start job: ' + error.message });
  }
});

// POST /api/upload/file/json - Simple upload endpoint
router.post('/upload/file/json', async (req, res) => {
  try {
    const { filename, projectName, postalCodes } = req.body;
    
    console.log('📤 Simple upload received:', { 
      filename, 
      projectName, 
      postalCodesCount: postalCodes?.length || 0 
    });
    
    // Validation
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }
    
    if (!postalCodes || !Array.isArray(postalCodes) || postalCodes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'postalCodes must be a non-empty array'
      });
    }
    
    // Generate project name
    const finalProjectName = projectName || filename.replace(/\.(csv|xlsx|xls)$/i, '');
    
    // Create project in Supabase
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: finalProjectName,
        postal_codes: postalCodes,
        status: 'active'
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Project creation error:', projectError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create project'
      });
    }
    
    console.log('✅ Project created:', project.id, 'with', postalCodes.length, 'postal codes');
    
    // Create results entries for each postal code
    const resultEntries = postalCodes.map(postalCode => ({
      project_id: project.id,
      postal_code: postalCode,
      status: 'pending'
    }));
    
    const { error: resultsError } = await supabase
      .from('results')
      .insert(resultEntries);
    
    if (resultsError) {
      console.error('Results creation error:', resultsError);
      // Don't fail the request, just log the error
    }
    
    // Return success response
    const response = {
      success: true,
      message: 'File uploaded successfully',
      project_id: project.id.toString(),
      results: postalCodes.map(code => ({
        postal_code: code,
        success: true
      })),
      summary: {
        total: postalCodes.length,
        success: postalCodes.length,
        error: 0
      }
    };
    
    console.log('✅ Upload completed successfully');
    return res.json(response);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed: ' + error.message
    });
  }
});

// GET /api/meta/test - Test Meta API configuration
router.get('/meta/test', async (req, res) => {
  try {
    console.log('🧪 Testing Meta API configuration...');
    
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
    
    console.log('🔍 ACCESS_TOKEN exists:', !!ACCESS_TOKEN);
    console.log('🔍 AD_ACCOUNT_ID:', AD_ACCOUNT_ID);
    
    if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
      return res.status(500).json({
        success: false,
        error: 'Meta API credentials not configured',
        details: {
          hasAccessToken: !!ACCESS_TOKEN,
          adAccountId: AD_ACCOUNT_ID
        }
      });
    }
    
    // Test basic API call - using ISO:POSTAL format (US:90210)
    const testUrl = `https://graph.facebook.com/v18.0/${AD_ACCOUNT_ID}/reachestimate?access_token=${ACCESS_TOKEN}&targeting_spec=${encodeURIComponent(JSON.stringify({
      geo_locations: {
        zips: [
          {
            key: 'US:90210'
          }
        ]
      }
    }))}&optimization_goal=REACH`;
    
    console.log('🌐 Testing URL:', testUrl.replace(ACCESS_TOKEN, 'ACCESS_TOKEN_HIDDEN'));
    
    const response = await fetch(testUrl);
    const data = await response.text();
    
    console.log('📡 Meta API Response Status:', response.status);
    console.log('📡 Meta API Response:', data);
    
    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: 'Meta API request failed',
        status: response.status,
        response: data
      });
    }
    
    const parsedData = JSON.parse(data);
    
    res.json({
      success: true,
      message: 'Meta API is working',
      config: {
        hasAccessToken: !!ACCESS_TOKEN,
        adAccountId: AD_ACCOUNT_ID
      },
      testResult: parsedData
    });
    
  } catch (error) {
    console.error('❌ Meta API test error:', error);
    res.status(500).json({
      success: false,
      error: 'Meta API test failed: ' + error.message
    });
  }
});

module.exports = router;