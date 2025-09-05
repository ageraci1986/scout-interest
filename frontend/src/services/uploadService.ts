import axios from 'axios';

const API_BASE_URL = '/api';

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

  // Extraire les codes postaux d'un fichier CSV
  private async extractPostalCodesFromFile(file: File): Promise<string[]> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          console.log('📁 File content length:', content.length);
          
          // Parser le fichier CSV
          const lines = content.split('\n').map(line => line.trim()).filter(line => line);
          console.log('📁 Total lines found:', lines.length);
          
          if (lines.length === 0) {
            console.warn('⚠️ No lines found in file');
            resolve([]);
            return;
          }
          
          // Détecter s'il y a un header (première ligne contient "postal_code", "zip", etc.)
          const firstLine = lines[0].toLowerCase();
          const hasHeader = firstLine.includes('postal') || firstLine.includes('zip') || firstLine.includes('code');
          
          // Extraire les codes postaux (ignorer le header si présent)
          const startIndex = hasHeader ? 1 : 0;
          const postalCodes: string[] = [];
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            
            // Gérer les CSV avec virgules ou autres délimiteurs
            const columns = line.split(/[,;\t]/).map(col => col.trim().replace(/"/g, ''));
            
            // Prendre la première colonne qui ressemble à un code postal
            for (const col of columns) {
              if (col && /^\d{5}(-\d{4})?$/.test(col)) {
                postalCodes.push(col);
                break;
              }
            }
          }
          
          // Supprimer les doublons
          const uniquePostalCodes = Array.from(new Set(postalCodes));
          
          console.log('📁 Extracted postal codes:', uniquePostalCodes);
          console.log('📁 Found', uniquePostalCodes.length, 'unique postal codes');
          
          if (uniquePostalCodes.length === 0) {
            console.warn('⚠️ No valid postal codes found in file');
          }
          
          resolve(uniquePostalCodes);
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
