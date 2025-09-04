const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { id } = req.query;

    if (req.method === 'GET') {
      // Récupérer le projet et ses résultats
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) {
        throw projectError;
      }

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Récupérer les résultats de traitement
      const { data: results, error: resultsError } = await supabase
        .from('processing_results')
        .select('*')
        .eq('project_id', id)
        .order('processed_at', { ascending: true });

      if (resultsError) {
        throw resultsError;
      }

      // Attacher les résultats au projet
      project.results = results || [];

      res.json({
        success: true,
        data: {
          project: project
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in project API:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

