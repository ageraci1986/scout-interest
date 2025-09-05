const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

console.log('🚀 Démarrage du serveur Vercel optimisé...');

// Middleware de sécurité et configuration
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Configuration CORS sécurisée
// CORS DÉFINITIF - Accepter tous les domaines Vercel du projet
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000'
];

// Ajouter tous les domaines Vercel possibles
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Autoriser tous les domaines Vercel du projet scout-interest
    if (origin && (
      origin.includes('scout-interest') || 
      origin.includes('frontend-') || 
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    )) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Health check endpoint optimisé pour Vercel
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0-vercel-optimized',
      message: 'Scout Interest API Vercel optimisée is running',
      services: {
        database: process.env.DATABASE_URL ? 'configured' : 'not_configured',
        meta_api: process.env.META_ACCESS_TOKEN ? 'configured' : 'not_configured',
        cors: process.env.CORS_ORIGIN || 'default',
        jwt: process.env.JWT_SECRET ? 'configured' : 'default'
      },
      features: {
        parallel_processor: 'optimized',
        authentication: 'enhanced',
        rate_limiting: 'enabled',
        caching: 'enabled'
      }
    };

    res.json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Test route simple
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test route fonctionne sur Vercel',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint pour les variables d'environnement
app.get('/api/debug/env', (req, res) => {
  res.json({
    message: 'Environment variables debug',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
      SUPABASE_URL_PREFIX: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 50) + '...' : 'MISSING',
      SUPABASE_ANON_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_ANON_KEY_PREFIX: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING',
      META_ACCESS_TOKEN_EXISTS: !!process.env.META_ACCESS_TOKEN,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL
    }
  });
});

// Migration endpoint
app.post('/api/migrate/apply-003', async (req, res) => {
  try {
    console.log('🔄 [MIGRATION] Starting migration 003...');

    const database = require('./config/database');
    const pool = database.pool;

    // Migration 003 SQL
    const migration003SQL = `
      -- Add fields for Job async pattern
      ALTER TABLE analysis_jobs 
      ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
      ADD COLUMN IF NOT EXISTS last_error TEXT,
      ADD COLUMN IF NOT EXISTS batch_size INTEGER DEFAULT 200,
      ADD COLUMN IF NOT EXISTS current_batch INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;

      -- Add index for worker queries
      CREATE INDEX IF NOT EXISTS idx_analysis_jobs_worker ON analysis_jobs(status, next_retry_at, created_at);

      -- Add job states enum check
      ALTER TABLE analysis_jobs 
      DROP CONSTRAINT IF EXISTS analysis_jobs_status_check;

      ALTER TABLE analysis_jobs 
      ADD CONSTRAINT analysis_jobs_status_check 
      CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retrying'));
    `;

    // Execute migration
    await pool.query(migration003SQL);

    console.log('✅ [MIGRATION] Migration 003 applied successfully');

    res.json({
      success: true,
      message: 'Migration 003 applied successfully',
      timestamp: new Date().toISOString(),
      changes: [
        'Added retry_count, max_retries, last_error columns',
        'Added batch_size, current_batch columns', 
        'Added started_at, completed_at, next_retry_at timestamps',
        'Added worker index idx_analysis_jobs_worker',
        'Updated status constraint for new states'
      ]
    });

  } catch (error) {
    console.error('❌ [MIGRATION] Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint pour créer un projet complet et tester le système
app.post('/api/test/create-complete-test', async (req, res) => {
  try {
    console.log('🧪 [TEST] Creating complete test project...');

    const database = require('./config/database');
    const pool = database.pool;

    // 1. Créer un projet de test
    const projectResult = await pool.query(`
      INSERT INTO projects (name, description, status, total_postal_codes, processed_postal_codes) 
      VALUES ('Test Job System Complete', 'Test complet du système de jobs', 'pending', 2, 0)
      RETURNING id
    `);
    const projectId = projectResult.rows[0].id;

    // 2. Créer des codes postaux
    await pool.query(`
      INSERT INTO postal_codes (project_id, postal_code, country, status) 
      VALUES 
        ($1, '10001', 'US', 'pending'),
        ($1, '90210', 'US', 'pending')
    `, [projectId]);

    // 3. Créer un job
    const crypto = require('crypto');
    const jobId = crypto.randomUUID();

    const targetingSpec = {
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      interests: [{"id": "6003107902433", "name": "Technology"}]
    };

    await pool.query(`
      INSERT INTO analysis_jobs (
        project_id, job_id, status, total_items, processed_items, failed_items,
        meta_targeting_spec, batch_size, current_batch, retry_count, max_retries
      ) VALUES ($1, $2, 'pending', 2, 0, 0, $3, 200, 0, 0, 3)
    `, [projectId, jobId, JSON.stringify(targetingSpec)]);

    console.log(`✅ [TEST] Created test project ${projectId} with job ${jobId}`);

    res.json({
      success: true,
      message: 'Complete test setup created',
      data: {
        projectId,
        jobId,
        postalCodes: ['10001', '90210'],
        nextSteps: [
          `Check pending jobs: GET /api/jobs/pending`,
          `Process jobs: POST /api/jobs/trigger`,
          `Check job status: GET /api/jobs/status/${jobId}`
        ]
      }
    });

  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Test setup failed',
      error: error.message
    });
  }
});

// Test cron endpoint (duplicate of /api/cron/process-jobs for testing)
app.post('/api/test/cron-process-jobs', async (req, res) => {
  try {
    console.log('🕒 [CRON-TEST] Starting test cron job processing...');

    const database = require('./config/database');
    const pool = database.pool;

    // Check if there are any pending jobs
    const pendingJobsResult = await pool.query(`
      SELECT COUNT(*) as count FROM analysis_jobs 
      WHERE status IN ('pending', 'retrying')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    `);

    const pendingCount = parseInt(pendingJobsResult.rows[0].count);
    
    if (pendingCount === 0) {
      console.log('✅ [CRON-TEST] No pending jobs found');
      return res.json({
        success: true,
        message: 'No pending jobs to process',
        pendingJobs: 0,
        processed: 0,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🚀 [CRON-TEST] Found ${pendingCount} pending jobs, would trigger worker...`);

    // Instead of calling worker, just simulate the response
    res.json({
      success: true,
      message: `Test cron simulation: would process ${pendingCount} pending jobs`,
      pendingJobs: pendingCount,
      processed: 0,
      note: 'This is a test simulation - no actual processing performed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [CRON-TEST] Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Test cron failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint pour simuler le flux targeting → déclenchement immédiat
app.post('/api/test/simulate-targeting-flow', async (req, res) => {
  try {
    console.log('🧪 [TEST-TARGETING] Simulating targeting validation with immediate trigger...');

    const database = require('./config/database');
    const pool = database.pool;

    // 1. Créer un projet et job (comme le ferait le targeting endpoint)
    const projectResult = await pool.query(`
      INSERT INTO projects (name, description, status, total_postal_codes, processed_postal_codes) 
      VALUES ('Test Targeting Flow', 'Test du flux targeting → déclenchement immédiat', 'processing', 2, 0)
      RETURNING id
    `);
    const projectId = projectResult.rows[0].id;

    await pool.query(`
      INSERT INTO postal_codes (project_id, postal_code, country, status) 
      VALUES 
        ($1, '10001', 'US', 'pending'),
        ($1, '90210', 'US', 'pending')
    `, [projectId]);

    // 2. Créer le job
    const crypto = require('crypto');
    const jobId = crypto.randomUUID();
    const targetingSpec = {
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      interests: [{"id": "6003107902433", "name": "Technology"}]
    };

    await pool.query(`
      INSERT INTO analysis_jobs (
        project_id, job_id, status, total_items, processed_items, failed_items,
        meta_targeting_spec, batch_size, current_batch, retry_count, max_retries
      ) VALUES ($1, $2, 'pending', 2, 0, 0, $3, 200, 0, 0, 3)
    `, [projectId, jobId, JSON.stringify(targetingSpec)]);

    console.log(`✅ [TEST-TARGETING] Job ${jobId} created, now triggering immediately...`);

    // 3. DÉCLENCHEMENT IMMÉDIAT - Simulation du trigger worker
    console.log(`🚀 [TEST-TARGETING] Simulating immediate worker trigger...`);
    
    // Au lieu d'un appel HTTP, simulons le résultat du worker
    const simulatedWorkerResult = {
      success: true,
      message: `Manual trigger completed. Processing job ${jobId}.`,
      pendingJobs: 1,
      processed: 1,
      results: [{ jobId, status: 'triggered' }]
    };
    
    // Mettre à jour le job pour indiquer qu'il a été déclenché
    await pool.query(`
      UPDATE analysis_jobs 
      SET status = 'running', started_at = NOW(), updated_at = NOW()
      WHERE job_id = $1
    `, [jobId]);
    
    res.json({
      success: true,
      message: 'Targeting flow simulation completed - job triggered immediately!',
      data: {
        projectId,
        jobId,
        workerResult: simulatedWorkerResult,
        flow: 'targeting_validation → job_creation → immediate_trigger → processing_started',
        checkStatus: `GET /api/jobs/status/${jobId}`,
        note: 'In real implementation, this would call /api/jobs/trigger endpoint'
      }
    });

  } catch (error) {
    console.error('❌ [TEST-TARGETING] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Targeting flow simulation failed',
      error: error.message
    });
  }
});

// Diagnostic endpoint pour tester la connexion DB
app.get('/api/debug/database-test', async (req, res) => {
  try {
    console.log('🔍 [DB-TEST] Testing database connection...');

    const database = require('./config/database');
    const pool = database.pool;

    const tests = [];

    // Test 1: Basic connection
    try {
      const connectionTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
      tests.push({
        test: 'Connection',
        status: '✅ SUCCESS',
        result: {
          current_time: connectionTest.rows[0].current_time,
          pg_version: connectionTest.rows[0].pg_version.substring(0, 50) + '...'
        }
      });
    } catch (error) {
      tests.push({
        test: 'Connection',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 2: Count existing tables
    try {
      const tablesTest = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      tests.push({
        test: 'Tables Check',
        status: '✅ SUCCESS',
        result: {
          tables_count: tablesTest.rows.length,
          tables: tablesTest.rows.map(r => r.table_name)
        }
      });
    } catch (error) {
      tests.push({
        test: 'Tables Check',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 3: Count projects
    try {
      const projectsTest = await pool.query('SELECT COUNT(*) as count FROM projects');
      const recentProjects = await pool.query(`
        SELECT id, name, created_at 
        FROM projects 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      tests.push({
        test: 'Projects Count',
        status: '✅ SUCCESS',
        result: {
          total_projects: parseInt(projectsTest.rows[0].count),
          recent_projects: recentProjects.rows
        }
      });
    } catch (error) {
      tests.push({
        test: 'Projects Count',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 4: Count analysis_jobs
    try {
      const jobsTest = await pool.query('SELECT COUNT(*) as count FROM analysis_jobs');
      const recentJobs = await pool.query(`
        SELECT job_id, project_id, status, created_at 
        FROM analysis_jobs 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      tests.push({
        test: 'Analysis Jobs Count',
        status: '✅ SUCCESS',
        result: {
          total_jobs: parseInt(jobsTest.rows[0].count),
          recent_jobs: recentJobs.rows
        }
      });
    } catch (error) {
      tests.push({
        test: 'Analysis Jobs Count',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 5: Test insertion
    try {
      const testId = Math.floor(Math.random() * 1000000);
      await pool.query(`
        INSERT INTO projects (name, description, status) 
        VALUES ($1, $2, $3)
      `, [`DB Test ${testId}`, 'Test connection insertion', 'pending']);
      
      const insertTest = await pool.query(`
        SELECT * FROM projects WHERE name = $1
      `, [`DB Test ${testId}`]);

      // Clean up
      await pool.query(`DELETE FROM projects WHERE name = $1`, [`DB Test ${testId}`]);

      tests.push({
        test: 'Insert/Delete Test',
        status: '✅ SUCCESS',
        result: {
          inserted_project: insertTest.rows[0],
          message: 'Successfully inserted and deleted test project'
        }
      });
    } catch (error) {
      tests.push({
        test: 'Insert/Delete Test',
        status: '❌ FAILED',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Database diagnostic completed',
      database_url_configured: !!process.env.DATABASE_URL,
      environment: process.env.NODE_ENV,
      tests,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [DB-TEST] Critical error:', error);
    res.status(500).json({
      success: false,
      message: 'Database diagnostic failed',
      error: error.message,
      database_url_configured: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    });
  }
});

// Chargement sécurisé des routes avec gestion d'erreur
let metaRoutesLoaded = false;
let projectRoutesLoaded = false;
let uploadRoutesLoaded = false;
let jobRoutesLoaded = false;

// Chargement des routes Meta
try {
  console.log('📁 Chargement des routes Meta...');
  const metaRoutes = require('./routes/meta');
  app.use('/api/meta', metaRoutes);
  metaRoutesLoaded = true;
  console.log('✅ Routes Meta chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes Meta:', error.message);
  // Route de fallback pour Meta
  app.get('/api/meta/*', (req, res) => {
    res.json({
      error: 'Meta routes not available',
      message: 'Meta API routes failed to load',
      timestamp: new Date().toISOString()
    });
  });
}

// Chargement des routes Projects
try {
  console.log('📁 Chargement des routes Projects...');
  const projectRoutes = require('./routes/projects');
  app.use('/api/projects', projectRoutes);
  projectRoutesLoaded = true;
  console.log('✅ Routes Projects chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes Projects:', error.message);
  // Route de fallback pour Projects
  app.get('/api/projects/*', (req, res) => {
    res.json({
      error: 'Project routes not available',
      message: 'Project API routes failed to load',
      timestamp: new Date().toISOString()
    });
  });
}

// Chargement des routes Upload
try {
  console.log('📁 Chargement des routes Upload...');
  const uploadRoutes = require('./routes/upload');
  app.use('/api/upload', uploadRoutes);
  uploadRoutesLoaded = true;
  console.log('✅ Routes Upload chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes Upload:', error.message);
  // Route de fallback pour Upload
  app.get('/api/upload/*', (req, res) => {
    res.json({
      error: 'Upload routes not available',
      message: 'Upload API routes failed to load',
      timestamp: new Date().toISOString()
    });
  });
}

// Chargement des routes Jobs
try {
  console.log('📁 Chargement des routes Jobs...');
  const jobRoutes = require('./routes/jobs');
  app.use('/api/jobs', jobRoutes);
  jobRoutesLoaded = true;
  console.log('✅ Routes Jobs chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes Jobs:', error.message);
  // Route de fallback pour Jobs
  app.get('/api/jobs/*', (req, res) => {
    res.json({
      error: 'Job routes not available',
      message: 'Job API routes failed to load',
      timestamp: new Date().toISOString()
    });
  });
}

// Status des routes
app.get('/api/routes-status', (req, res) => {
  res.json({
    routes_status: {
      meta: metaRoutesLoaded ? 'loaded' : 'failed',
      projects: projectRoutesLoaded ? 'loaded' : 'failed',
      upload: uploadRoutesLoaded ? 'loaded' : 'failed',
      jobs: jobRoutesLoaded ? 'loaded' : 'failed'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    requested_url: req.url,
    method: req.method
  });
});

console.log('🎉 Serveur Vercel optimisé prêt !');

// Export pour Vercel
module.exports = app;
