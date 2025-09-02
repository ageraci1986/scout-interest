import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    uploadId: number;
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
    allPostalCodes?: string[]; // All processed postal codes from backend
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
    allPostalCodes?: string[]; // All processed postal codes from backend
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
  // Upload file
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    console.log('📤 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('🌐 API URL:', `${API_BASE_URL}/upload/file`);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 secondes timeout
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${percentCompleted}%`);
          }
        }
      });

      console.log('✅ Upload response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      throw error;
    }
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

  // Store postal codes on backend
  async storePostalCodes(postalCodes: string[]): Promise<any> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/store-postal-codes`, {
        postalCodes,
        sessionId
      }, {
        timeout: 30000
      });
      
      // Store sessionId in localStorage for retrieval
      localStorage.setItem('postalCodesSessionId', sessionId);
      
      return response.data;
    } catch (error) {
      console.error('Store postal codes error:', error);
      throw error;
    }
  }

  // Retrieve postal codes from backend
  async getPostalCodes(sessionId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/upload/get-postal-codes/${sessionId}`, {
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error('Get postal codes error:', error);
      throw error;
    }
  }
}

const uploadService = new UploadService();
export default uploadService;
