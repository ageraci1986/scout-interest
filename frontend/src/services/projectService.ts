import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface Project {
  id: number;
  name: string;
  description?: string;
  user_id: string;
  status: string;
  total_postal_codes: number;
  processed_postal_codes: number;
  error_postal_codes: number;
  targeting_spec?: any;
  created_at: string;
  updated_at: string;
}

export interface ProcessingResult {
  id: number;
  project_id: number;
  postal_code: string;
  country_code: string;
  zip_data?: any;
  postal_code_only_estimate?: any;
  postal_code_with_targeting_estimate?: any;
  targeting_spec?: any;
  success: boolean;
  error_message?: string;
  processed_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  userId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
}

class ProjectService {
  // Créer un nouveau projet
  async createProject(projectData: CreateProjectRequest): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/projects`, projectData);
      return { success: true, project: response.data.data.project };
    } catch (error: any) {
      console.error('Error creating project:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Récupérer un projet par ID
  async getProject(projectId: number): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
      return { success: true, project: response.data.data.project };
    } catch (error: any) {
      console.error('Error getting project:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Récupérer tous les projets d'un utilisateur
  async getUserProjects(userId: string): Promise<{ success: boolean; projects?: Project[]; error?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/user/${userId}`);
      return { success: true, projects: response.data.data.projects };
    } catch (error: any) {
      console.error('Error getting user projects:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Mettre à jour un projet
  async updateProject(projectId: number, updateData: UpdateProjectRequest): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/projects/${projectId}`, updateData);
      return { success: true, project: response.data.data.project };
    } catch (error: any) {
      console.error('Error updating project:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Supprimer un projet
  async deleteProject(projectId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.delete(`${API_BASE_URL}/projects/${projectId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting project:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Récupérer les résultats d'un projet
  async getProjectResults(projectId: number): Promise<{ success: boolean; results?: ProcessingResult[]; error?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/results`);
      return { success: true, results: response.data.data.results };
    } catch (error: any) {
      console.error('Error getting project results:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Sauvegarder les résultats de traitement
  async saveProjectResults(projectId: number, results: any[]): Promise<{ success: boolean; savedCount?: number; error?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/results`, { results });
      return { success: true, savedCount: response.data.data.savedCount };
    } catch (error: any) {
      console.error('Error saving project results:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Créer un projet automatiquement lors de l'upload
  async createProjectFromUpload(filename: string, postalCodeCount: number): Promise<{ success: boolean; project?: Project; error?: string }> {
    const projectName = `Project from ${filename}`;
    const description = `Auto-generated project from file upload with ${postalCodeCount} postal codes`;
    
    return this.createProject({
      name: projectName,
      description,
      userId: 'anonymous' // Pour l'instant, on utilise anonymous
    });
  }
}

export default new ProjectService();

