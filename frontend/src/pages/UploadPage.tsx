import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import uploadService, { UploadResponse, ValidationResponse } from '../services/uploadService';
import projectService from '../services/projectService';
import toast from 'react-hot-toast';
import UploadTester from '../components/UploadTester';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    setUploadResult(null);
    setValidationResult(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      console.log('📤 Starting file upload...');
      console.log('📁 File:', uploadedFiles[0].name, 'Size:', uploadedFiles[0].size);
      
      const result = await uploadService.uploadFile(uploadedFiles[0]);
      console.log('✅ Upload successful:', result);
      
      setUploadResult(result);
      
      // Save postal codes to localStorage for the results page
      if (result.data && result.data.statistics) {
        console.log('📋 Upload result data:', result.data);
        console.log('📋 Headers:', result.data.headers);
        console.log('📋 Preview rows:', result.data.preview?.rows);
        console.log('📋 All postal codes from backend:', result.data.allPostalCodes?.length || 0);
        
        // Use allPostalCodes from backend if available, otherwise fallback to preview extraction
        let postalCodes: string[] = [];
        
        if (result.data.allPostalCodes && Array.isArray(result.data.allPostalCodes)) {
          // Use the complete list from backend
          postalCodes = result.data.allPostalCodes;
          console.log('✅ Using all postal codes from backend:', postalCodes.length, 'codes');
        } else {
          // Fallback to preview extraction (old method)
          console.log('⚠️ No allPostalCodes from backend, using preview extraction...');
          
          // Find the postal code column more robustly
          const postalCodeColumnIndex = result.data.postalCodeColumn !== undefined ? 
            result.data.postalCodeColumn : 
            result.data.headers.findIndex((header: string) => {
              const lowerHeader = header.toLowerCase();
              return lowerHeader.includes('postal') || 
                     lowerHeader.includes('code') || 
                     lowerHeader.includes('zip') ||
                     lowerHeader.includes('cp') ||
                     lowerHeader.includes('postcode');
            });
          
          console.log('🔍 Postal code column index:', postalCodeColumnIndex);
          console.log('🔍 Postal code column name:', postalCodeColumnIndex >= 0 ? result.data.headers[postalCodeColumnIndex] : 'Not found');
          
          if (postalCodeColumnIndex >= 0 && result.data.preview?.rows) {
            postalCodes = result.data.preview.rows
              .map((row: any) => {
                const code = row.data[postalCodeColumnIndex];
                return code && code.toString().trim() !== '' ? code.toString().trim() : null;
              })
              .filter((code: string | null) => code !== null);
          } else {
            // Fallback: try to extract from any column that looks like postal codes
            console.log('⚠️ No specific postal code column found, trying fallback extraction...');
            if (result.data.preview?.rows) {
              postalCodes = result.data.preview.rows
                .flatMap((row: any) => 
                  row.data
                    .map((cell: any) => cell?.toString().trim())
                    .filter((cell: string) => {
                      // Look for patterns that look like postal codes (5 digits for US, 5 digits for FR, etc.)
                      return /^\d{5}$/.test(cell) || /^\d{4,6}$/.test(cell);
                    })
                )
                .filter((code: string, index: number, arr: string[]) => arr.indexOf(code) === index); // Remove duplicates
            }
          }
        }
        
        console.log('📦 Extracted postal codes:', postalCodes);
        
        // Check if we have a large number of postal codes
        if (postalCodes.length > 1000) { // Large file threshold
          console.log('📊 Large file detected:', postalCodes.length, 'postal codes');
          
          try {
            // For large files, store on backend
            const storeResult = await uploadService.storePostalCodes(postalCodes);
            console.log('✅ Stored postal codes on backend:', storeResult);
            
            // Also store a sample in localStorage for immediate access
            const sampleSize = Math.min(1000, postalCodes.length);
            const sample = postalCodes.slice(0, sampleSize);
            localStorage.setItem('uploadedPostalCodes', JSON.stringify(sample));
            localStorage.setItem('uploadedPostalCodesCount', sampleSize.toString());
            localStorage.setItem('uploadedPostalCodesTotal', postalCodes.length.toString());
            localStorage.setItem('useBackendStorage', 'true');
            
            console.log('📦 Backend storage with sample in localStorage:', sampleSize, 'sample codes');
          } catch (error) {
            console.error('❌ Failed to store on backend, falling back to localStorage:', error);
            
            // Fallback to localStorage with splitting
            const localStorageLimit = 1000;
            const forLocalStorage = postalCodes.slice(0, localStorageLimit);
            const forSessionStorage = postalCodes.slice(localStorageLimit);
            
            localStorage.setItem('uploadedPostalCodes', JSON.stringify(forLocalStorage));
            localStorage.setItem('uploadedPostalCodesCount', forLocalStorage.length.toString());
            localStorage.setItem('uploadedPostalCodesTotal', postalCodes.length.toString());
            localStorage.setItem('useBackendStorage', 'false');
            
            if (forSessionStorage.length > 0) {
              sessionStorage.setItem('uploadedPostalCodesRemaining', JSON.stringify(forSessionStorage));
              console.log('📦 Split storage: localStorage:', forLocalStorage.length, 'sessionStorage:', forSessionStorage.length);
            }
          }
        } else {
          // For smaller files, use localStorage as before
          localStorage.setItem('uploadedPostalCodes', JSON.stringify(postalCodes));
          localStorage.setItem('uploadedPostalCodesCount', postalCodes.length.toString());
          localStorage.setItem('uploadedPostalCodesTotal', postalCodes.length.toString());
          localStorage.setItem('useBackendStorage', 'false');
        }
        
        console.log('✅ Saved postal codes to storage:', postalCodes.length, 'total codes');
        
        // Créer automatiquement un projet pour ce traitement
        try {
          const projectResult = await projectService.createProjectFromUpload(
            uploadedFiles[0].name,
            postalCodes.length
          );
          
          if (projectResult.success && projectResult.project) {
            console.log('✅ Project created:', projectResult.project);
            localStorage.setItem('currentProjectId', projectResult.project.id.toString());
            localStorage.setItem('currentProjectName', projectResult.project.name);
            toast.success(`Project "${projectResult.project.name}" created successfully!`);
          } else {
            console.error('❌ Failed to create project:', projectResult.error);
            // Continuer même si la création du projet échoue
          }
        } catch (projectError) {
          console.error('❌ Error creating project:', projectError);
          // Continuer même si la création du projet échoue
        }
        
        if (postalCodes.length === 0) {
          console.warn('⚠️ No postal codes extracted from the file!');
          toast.error('No postal codes found in the file. Please check your file format.');
        } else {
          toast.success(`File uploaded successfully! ${postalCodes.length} postal codes detected.`);
        }
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Detailed error handling
      if (error.response) {
        // Server response error
        const errorMessage = error.response.data?.message || 'Upload error';
        console.error('Server error:', error.response.status, errorMessage);
        toast.error(`Server error: ${errorMessage}`);
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        toast.error('Connection error. Please check your internet connection.');
      } else {
        // Other error
        console.error('Other error:', error.message);
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadService.validateFile(uploadedFiles[0]);
      setValidationResult(result);
      toast.success('File validated successfully!');
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Postal Codes
        </h1>
        <p className="text-lg text-gray-600">
          Import your Excel or CSV file containing your postal codes to start the analysis.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="card">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop the file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-gray-500 mt-2">or click to select</p>
            </div>
            <p className="text-sm text-gray-400">
              Supported formats: .xlsx, .xls, .csv (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* File Preview */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Selected File
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Buttons */}
      {uploadedFiles.length > 0 && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleValidate}
            disabled={isUploading}
            className={`btn-secondary text-lg px-6 py-3 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Validating...</span>
              </div>
            ) : (
              'Validate File'
            )}
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`btn-primary text-lg px-8 py-3 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              'Continue to Analysis'
            )}
          </button>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Validation Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validationResult.data.statistics.valid}</div>
              <div className="text-sm text-green-700">Valid postal codes</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{validationResult.data.statistics.invalid}</div>
              <div className="text-sm text-red-700">Invalid postal codes</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{validationResult.data.statistics.duplicates}</div>
              <div className="text-sm text-yellow-700">Duplicates</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{validationResult.data.statistics.total}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
          </div>
          
          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {validationResult.data.headers.map((header, index) => (
                    <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationResult.data.preview.rows.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {row.data.map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            File Processed Successfully
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{uploadResult.data.statistics.valid}</div>
              <div className="text-sm text-green-700">Valid postal codes</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{uploadResult.data.statistics.invalid}</div>
              <div className="text-sm text-red-700">Invalid postal codes</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{uploadResult.data.statistics.duplicates}</div>
              <div className="text-sm text-yellow-700">Duplicates</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{uploadResult.data.statistics.total}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
          </div>
          
          <div className="text-center">
            <button 
              onClick={async () => {
                try {
                  // Créer un vrai projet pour ce traitement
                  const projectResult = await projectService.createProjectFromUpload(
                    uploadedFiles[0].name,
                    uploadResult.data.statistics.total
                  );
                  
                  if (projectResult.success && projectResult.project) {
                    console.log('✅ Project created:', projectResult.project);
                    toast.success(`Project "${projectResult.project.name}" created successfully!`);
                    
                    // Navigate to targeting page with real project ID and postal codes
                    const postalCodesParam = encodeURIComponent(JSON.stringify(uploadResult.data.allPostalCodes || []));
                    navigate(`/targeting?projectId=${projectResult.project.id}&postalCodes=${postalCodesParam}`);
                  } else {
                    console.error('❌ Failed to create project:', projectResult.error);
                    toast.error('Failed to create project. Please try again.');
                  }
                } catch (projectError) {
                  console.error('❌ Error creating project:', projectError);
                  toast.error('Error creating project. Please try again.');
                }
              }}
              className="btn-primary"
            >
              Continue to Targeting
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          File Format Instructions
        </h3>
        <div className="space-y-2 text-blue-800">
          <p>• Your file must contain a column with postal codes</p>
          <p>• Postal codes can be in any column</p>
          <p>• Supported formats: Excel (.xlsx, .xls) and CSV</p>
          <p>• Maximum size: 10 MB</p>
          <p>• We will automatically detect the postal code column</p>
        </div>
      </div>

      {/* Upload Tester for debugging */}
      <UploadTester />
    </div>
  );
};

export default UploadPage;
