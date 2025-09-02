// Mock service pour les projets (fonctionne sans base de données)
class ProjectService {
  constructor() {
    console.log('📋 ProjectService: Using mock service (no database connection)');
  }

  // Créer un nouveau projet
  async createProject(projectData) {
    try {
      console.log('📋 Creating project with data:', projectData);
      
      // Simuler la création d'un projet
      const project = {
        id: Date.now().toString(),
        name: projectData.name || 'Untitled Project',
        description: projectData.description || '',
        user_id: projectData.userId || 'anonymous',
        status: 'active',
        total_postal_codes: 0,
        processed_postal_codes: 0,
        error_postal_codes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        targeting_spec: null
      };
      
      console.log('✅ Project created:', project.id);
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
      
      // Simuler un projet
      const project = {
        id: projectId,
        name: `Project ${projectId}`,
        description: 'Sample project',
        user_id: 'anonymous',
        status: 'active',
        total_postal_codes: 5,
        processed_postal_codes: 5,
        error_postal_codes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        targeting_spec: null
      };
      
      console.log('✅ Project retrieved:', project.id);
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
      
      // Simuler des projets
      const projects = [
        {
          id: "1",
          name: "Test Project 1",
          description: "Sample project for testing",
          user_id: userId,
          status: "active",
          total_postal_codes: 5,
          processed_postal_codes: 5,
          error_postal_codes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          targeting_spec: null
        },
        {
          id: "2",
          name: "Test Project 2",
          description: "Another test project",
          user_id: userId,
          status: "active",
          total_postal_codes: 3,
          processed_postal_codes: 3,
          error_postal_codes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          targeting_spec: null
        }
      ];

      console.log('✅ Retrieved projects count:', projects.length);
      return { success: true, projects };
    } catch (error) {
      console.error('❌ Error getting user projects:', error);
      return { success: false, error: error.message };
    }
  }

  // Sauvegarder les résultats de traitement (mock)
  async saveProcessingResults(projectId, results) {
    try {
      console.log(`📋 Mock: Saving ${results.length} results for project ${projectId}`);
      
      // Simuler la sauvegarde
      console.log(`✅ Mock: Saved ${results.length} processing results for project ${projectId}`);
      return { success: true, savedCount: results.length };
    } catch (error) {
      console.error('❌ Error saving processing results:', error);
      return { success: false, error: error.message };
    }
  }

  // Récupérer les résultats d'un projet (mock avec résultats simulés)
  async getProjectResults(projectId) {
    try {
      console.log(`📋 Mock: Getting results for project ${projectId}`);
      
      // Simuler des résultats de traitement
      const mockResults = [
        {
          id: 1,
          project_id: projectId,
          postal_code: '75001',
          country_code: 'FR',
          postal_code_only_estimate: {
            data: {
              users_lower_bound: 45000,
              users_upper_bound: 55000
            }
          },
          postal_code_with_targeting_estimate: {
            data: {
              users_lower_bound: 25000,
              users_upper_bound: 30000
            }
          },
          success: true,
          error_message: null,
          processed_at: new Date().toISOString()
        },
        {
          id: 2,
          project_id: projectId,
          postal_code: '75002',
          country_code: 'FR',
          postal_code_only_estimate: {
            data: {
              users_lower_bound: 38000,
              users_upper_bound: 48000
            }
          },
          postal_code_with_targeting_estimate: {
            data: {
              users_lower_bound: 22000,
              users_upper_bound: 27000
            }
          },
          success: true,
          error_message: null,
          processed_at: new Date().toISOString()
        }
      ];
      
      console.log(`✅ Mock: Retrieved ${mockResults.length} results for project ${projectId}`);
      return { success: true, results: mockResults };
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
