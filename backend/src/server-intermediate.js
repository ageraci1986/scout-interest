

// Upload endpoint pour les fichiers
app.post('/api/upload', async (req, res) => {
  try {
    // Simuler un upload de fichier
    const { filename, postalCodes } = req.body;
    
    if (!filename || !postalCodes) {
      return res.status(400).json({
        success: false,
        error: 'Filename and postalCodes are required'
      });
    }
    
    // Créer un nouveau projet
    const db = require('./config/database');
    const project = await db.run(`
      INSERT INTO projects (name, description, user_id, status, total_postal_codes, processed_postal_codes, error_postal_codes, targeting_spec)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      filename,
      `Auto-generated project from file upload with ${postalCodes.length} postal codes`,
      'anonymous',
      'active',
      postalCodes.length,
      0,
      0,
      null
    ]);
    
    const projectId = project.id;
    
    // Simuler le traitement des codes postaux
    const results = [];
    for (const postalCode of postalCodes) {
      try {
        // Simuler une estimation d'audience
        const audienceEstimate = Math.floor(Math.random() * 100000) + 1000;
        const targetingEstimate = Math.floor(audienceEstimate * 0.1) + 100;
        
        const result = await db.run(`
          INSERT INTO processing_results (project_id, postal_code, country_code, success, error_message, targeting_spec)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          projectId,
          postalCode,
          'US',
          true,
          null,
          JSON.stringify({
            age_max: 65,
            age_min: 18,
            genders: [1, 2],
            geo_locations: [{ countries: ['US'] }]
          })
        ]);
        
        results.push({
          id: result.id,
          postal_code: postalCode,
          success: true,
          audience_estimate: audienceEstimate,
          targeting_estimate: targetingEstimate
        });
        
      } catch (error) {
        console.error(`Error processing postal code ${postalCode}:`, error);
        results.push({
          postal_code: postalCode,
          success: false,
          error_message: error.message
        });
      }
    }
    
    // Mettre à jour le projet avec le nombre de codes traités
    await db.run(`
      UPDATE projects 
      SET processed_postal_codes = $1, error_postal_codes = $2
      WHERE id = $3
    `, [
      results.filter(r => r.success).length,
      results.filter(r => !r.success).length,
      projectId
    ]);
    
    res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      project_id: projectId,
      results: results,
      summary: {
        total: postalCodes.length,
        success: results.filter(r => r.success).length,
        error: results.filter(r => !r.success).length
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
});

// GET endpoint pour l'upload (pour tester)
app.get('/api/upload', (req, res) => {
  res.json({
    success: true,
    message: 'Upload endpoint is available',
    method: 'POST',
    required_fields: ['filename', 'postalCodes']
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Export pour Vercel
module.exports = app;
