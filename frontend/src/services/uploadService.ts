import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface UploadResponse {
  success: boolean;
  message: string;
  project_id: string;
  results: any[];
  summary: {
    total: number;
    success: number;
    error: number;
  };
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    statistics: {
      total: number;
      valid: number;
      invalid: number;
      duplicates: number;
    };
    preview: {
      headers: string[];
      rows: any[];
      totalRows: number;
      previewRows: number;
    };
    postalCodeColumn: number;
    headers: string[];
    invalidPostalCodes: any[];
    duplicates: any[];
    allPostalCodes?: string[];
  };
}

export interface SaveResponse {
  success: boolean;
  message: string;
  data: {
    projectId: number;
    savedCount: number;
    jobId: string;
    statistics: {
      total: number;
      valid: number;
      invalid: number;
      duplicates: number;
    };
  };
}

class UploadService {
  // Upload file with JSON endpoint
  async uploadFile(file: File): Promise<UploadResponse> {
    try {
      console.log('📤 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('🌐 API URL:', `${API_BASE_URL}/upload/file/json`);

      // Extraire les codes postaux du fichier
      const postalCodes = await this.extractPostalCodesFromFile(file);
      
      if (postalCodes.length === 0) {
        throw new Error('No postal codes found in file');
      }

      console.log('📤 Extracted postal codes:', postalCodes.length);

      // Envoyer les données au format JSON
      const response = await axios.post(`${API_BASE_URL}/upload/file/json`, {
        filename: file.name,
        postalCodes: postalCodes
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

      console.log('✅ Upload response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }

  // Extraire les codes postaux d'un fichier (simulation)
  private async extractPostalCodesFromFile(file: File): Promise<string[]> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // Simulation d'extraction de codes postaux
          // En production, vous devriez parser le fichier Excel/CSV
          const mockPostalCodes = ['75001', '75002', '75003', '75004', '75005'];
          
          console.log('📁 File content length:', content.length);
          console.log('📁 Extracted postal codes:', mockPostalCodes);
          
          resolve(mockPostalCodes);
        } catch (error) {
          console.error('❌ Error extracting postal codes:', error);
          resolve([]);
        }
      };
      
      reader.onerror = () => {
        console.error('❌ Error reading file');
        resolve([]);
      };
      
      reader.readAsText(file);
    });
  }

  // Validate file without saving
  async validateFile(file: File): Promise<ValidationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/upload/validate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Save validated data to database
  async saveData(uploadId: number, projectId: number): Promise<SaveResponse> {
    const response = await axios.post(`${API_BASE_URL}/upload/save/${uploadId}`, {
      projectId,
    });

    return response.data;
  }

  // Get upload status
  async getUploadStatus(uploadId: number) {
    const response = await axios.get(`${API_BASE_URL}/upload/status/${uploadId}`);
    return response.data;
  }
}

const uploadService = new UploadService();
export default uploadService;
