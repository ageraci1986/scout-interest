import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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

    const response = await axios.post(`${API_BASE_URL}/api/upload/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Validate file without saving
  async validateFile(file: File): Promise<ValidationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/api/upload/validate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Save validated data to database
  async saveData(uploadId: number, projectId: number): Promise<SaveResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/upload/save/${uploadId}`, {
      projectId,
    });

    return response.data;
  }

  // Get upload status
  async getUploadStatus(uploadId: number) {
    const response = await axios.get(`${API_BASE_URL}/api/upload/status/${uploadId}`);
    return response.data;
  }
}

export default new UploadService();
