import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from '../config/api';

console.log('🔍 ProjectService - API_BASE_URL:', API_BASE_URL);
console.log('🔍 ProjectService - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

export interface Project {
  id: string;
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
  results?: ProcessingResult[];
}

export interface ProcessingResult {
  id: string;
  project_id: string;
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
      console.log('📋 Creating project with URL:', `${API_BASE_URL}/projects`);
      const response = await axios.post(`${API_BASE_URL}/projects`, projectData);
      return { success: true, project: response.data.data?.project || response.data.project };
    } catch (error: any) {
      console.error('❌ Error creating project:', error);
      console.error('❌ Request URL:', `${API_BASE_URL}/projects`);
      console.error('❌ Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Récupérer un projet par ID
  async getProject(projectId: string): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      console.log('📋 Getting project with URL:', `${API_BASE_URL}/projects/${projectId}`);
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
      return { success: true, project: response.data.data?.project || response.data.project };
    } catch (error: any) {
      console.error('❌ Error getting project:', error);
      console.error('❌ Request URL:', `${API_BASE_URL}/projects/${projectId}`);
      console.error('❌ Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Récupérer tous les projets d'un utilisateur (corrigé pour anonymous)
  async getUserProjects(userId: string = 'anonymous'): Promise<{ success: boolean; projects?: Project[]; error?: string }> {
    try {
      const url = `${API_BASE_URL}/projects/user/anonymous`;
      console.log('📋 Getting user projects with URL:', url);
      console.log('📋 Full request details:', {
        url: url,
        method: 'GET',
        userId: userId
      });
      
      const response = await axios.get(url);
      console.log('✅ User projects response:', response.data);
      
      // Vérifier la structure de la réponse (API retourne data.data.projects)
      if (response.data && response.data.success && response.data.data && response.data.data.projects) {
        return { success: true, projects: response.data.data.projects };
      } else if (response.data && response.data.success && response.data.projects) {
        // Fallback pour l'ancienne structure
        return { success: true, projects: response.data.projects };
      } else {
        console.error('❌ Invalid response structure:', response.data);
        return { 
          success: false, 
          error: 'Invalid response structure from API' 
        };
      }
    } catch (error: any) {
      console.error('❌ Error getting user projects:', error);
      console.error('❌ Request URL:', `${API_BASE_URL}/projects/user/anonymous`);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Mettre à jour un projet
  async updateProject(projectId: string, updateData: UpdateProjectRequest): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/projects/${projectId}`, updateData);
      return { success: true, project: response.data.data?.project || response.data.project };
    } catch (error: any) {
      console.error('Error updating project:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Supprimer un projet
  async deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
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
  async getProjectResults(projectId: string): Promise<{ success: boolean; results?: ProcessingResult[]; error?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/results`);
      return { success: true, results: response.data.results };
    } catch (error: any) {
      console.error('Error getting project results:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Sauvegarder les résultats de traitement
  async saveProjectResults(projectId: string, results: any[]): Promise<{ success: boolean; savedCount?: number; error?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/results`, { results });
      return { success: true, savedCount: response.data.savedCount };
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

const projectService = new ProjectService();
export default projectService;

