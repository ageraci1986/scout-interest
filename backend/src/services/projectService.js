// VRAI service pour les projets avec base de données Supabase
class ProjectService {
  constructor() {
    console.log('📋 ProjectService: Initializing with REAL database connection');
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Utiliser la vraie base de données Supabase
      const { createClient } = require('@supabase/supabase-js');
      
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        console.log('✅ ProjectService: Connected to Supabase database');
      } else {
        console.log('⚠️ ProjectService: Supabase credentials missing, using fallback');
        this.supabase = null;
      }
    } catch (error) {
      console.error('❌ ProjectService: Database initialization failed:', error);
      this.supabase = null;
    }
  }

  // Créer un nouveau projet
  async createProject(projectData) {
    try {
      console.log('📋 Creating project with data:', projectData);
      
      if (!this.supabase) {
        throw new Error('Database not initialized');
      }
      
      const { data: project, error } = await this.supabase
        .from('projects')
        .insert({
          name: projectData.name || 'Untitled Project',
          description: projectData.description || '',
          user_id: projectData.userId || 'anonymous',
          status: 'active',
          total_postal_codes: 0,
          processed_postal_codes: 0,
          error_postal_codes: 0,
          targeting_spec: null
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Project created in database:', project.id);
      return { success: true, project };
    } catch (error) {
      console.error('❌ Error creating project:', error);
      return { success: false, error: error.message };
    }
  }

  // Récupérer un projet par ID
  async getProject(projectId) {
    try {
      console.log('📋 Getting project with ID:', projectId);
      
      if (!this.supabase) {
        throw new Error('Database not initialized');
      }
      
      const { data: project, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Project retrieved from database:', project.id);
      return { success: true, project };
    } catch (error) {
      console.error('❌ Error getting project:', error);
      return { success: false, error: error.message };
    }
  }

  // Récupérer tous les projets d'un utilisateur
  async getUserProjects(userId) {
    try {
      console.log('📋 Getting projects for user:', userId);
      
      if (!this.supabase) {
        throw new Error('Database not initialized');
      }
      
      const { data: projects, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Retrieved projects from database:', projects.length);
      return { success: true, projects: projects || [] };
    } catch (error) {
      console.error('❌ Error getting user projects:', error);
      return { success: false, error: error.message };
    }
  }

  // Sauvegarder les résultats de traitement (VRAI)
  async saveProcessingResults(projectId, results) {
    try {
      console.log(`📋 Saving ${results.length} results to database for project ${projectId}`);
      
      if (!this.supabase) {
        throw new Error('Database not initialized');
      }
      
      // Préparer les données pour la base
      const resultsToInsert = results.map(result => ({
        project_id: projectId,
        postal_code: result.postalCode,
        country_code: result.countryCode,
        postal_code_only_estimate: result.postalCodeOnlyEstimate,
        postal_code_with_targeting_estimate: result.postalCodeWithTargetingEstimate,
        success: result.success,
        error_message: result.error,
        processed_at: new Date().toISOString()
      }));
      
      const { data, error } = await this.supabase
        .from('processing_results')
        .insert(resultsToInsert);
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Saved ${results.length} results to database for project ${projectId}`);
      return { success: true, savedCount: results.length };
    } catch (error) {
      console.error('❌ Error saving processing results:', error);
      return { success: false, error: error.message };
    }
  }

  // Récupérer les résultats d'un projet (VRAI)
  async getProjectResults(projectId) {
    try {
      console.log(`📋 Getting results from database for project ${projectId}`);
      
      if (!this.supabase) {
        throw new Error('Database not initialized');
      }
      
      const { data: results, error } = await this.supabase
        .from('processing_results')
        .select('*')
        .eq('project_id', projectId)
        .order('processed_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Retrieved ${results.length} results from database for project ${projectId}`);
      return { success: true, results: results || [] };
    } catch (error) {
      console.error('❌ Error getting project results:', error);
      return { success: false, error: error.message };
    }
  }

  // Mettre à jour un projet
  async updateProject(projectId, updateData) {
    try {
      const updateFields = [];
      const updateValues = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'id') {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      updateFields.push('updated_at = datetime(\'now\')');
      updateValues.push(projectId);

      const sql = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.db.run(sql, updateValues);

      // Récupérer le projet mis à jour
      const project = await this.db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      
      return { success: true, project };
    } catch (error) {
      console.error('❌ Error updating project:', error);
      return { success: false, error: error.message };
    }
  }

  // Supprimer un projet
  async deleteProject(projectId) {
    try {
      // Supprimer d'abord les résultats de traitement
      await this.db.run('DELETE FROM processing_results WHERE project_id = $1', [projectId]);
      
      // Puis supprimer le projet
      await this.db.run('DELETE FROM projects WHERE id = $1', [projectId]);
      
      console.log(`✅ Project ${projectId} deleted successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      return { success: false, error: error.message };
    }
  }

  // Créer un projet à partir d'un upload de fichier
  async createProjectFromUpload(fileName, postalCodeCount) {
    const projectData = {
      name: `Project from ${fileName}`,
      description: `Auto-generated project from file upload with ${postalCodeCount} postal codes`,
      userId: 'anonymous'
    };

    return this.createProject(projectData);
  }

  // Mettre à jour le targeting spec d'un projet
  async updateProjectTargetingSpec(projectId, targetingSpec) {
    try {
      await this.db.run(
        'UPDATE projects SET targeting_spec = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(targetingSpec), projectId]
      );

      // Récupérer le projet mis à jour
      const project = await this.db.get('SELECT * FROM projects WHERE id = $1', [projectId]);
      
      if (project) {
        // Parser le targeting_spec JSON seulement s'il est une chaîne
        if (project.targeting_spec && typeof project.targeting_spec === 'string') {
          try {
            project.targeting_spec = JSON.parse(project.targeting_spec);
          } catch (parseError) {
            console.warn('⚠️ Could not parse targeting_spec JSON:', parseError);
            project.targeting_spec = null;
          }
        }
      }
      
      console.log(`✅ Updated targeting spec for project ${projectId}`);
      return { success: true, project };
    } catch (error) {
      console.error('❌ Error updating project targeting spec:', error);
      return { success: false, error: error.message };
    }
  }

  // Get project processing status
  async getProjectStatus(projectId) {
    try {
      // Get project info
      const project = await this.db.get('SELECT * FROM projects WHERE id = $1', [projectId]);
      
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Get processing results count
      const results = await this.db.all('SELECT * FROM processing_results WHERE project_id = $1', [projectId]);
      
      const total = results.length;
      const completed = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).length;
      const success = completed;

      const status = {
        total,
        completed,
        success,
        errors,
        isProcessing: total > 0 && completed < total
      };

      console.log(`📊 Project ${projectId} status:`, status);
      return { success: true, status };
    } catch (error) {
      console.error('❌ Error getting project status:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ProjectService();
