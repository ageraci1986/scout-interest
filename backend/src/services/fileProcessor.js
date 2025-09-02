const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class FileProcessor {
  constructor() {
    this.supportedFormats = ['.xlsx', '.xls', '.csv'];
  }

  // Read file and extract data
  async processFile(filePath, fileBuffer = null) {
    let ext;
    
    if (fileBuffer) {
      // Handle buffer data (from memory storage)
      ext = this.getExtensionFromBuffer(fileBuffer);
    } else {
      // Handle file path (from disk storage)
      ext = path.extname(filePath).toLowerCase();
    }
    
    if (!this.supportedFormats.includes(ext)) {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    try {
      let data;
      
      if (ext === '.csv') {
        data = fileBuffer ? await this.readCSVFromBuffer(fileBuffer) : await this.readCSV(filePath);
      } else {
        data = fileBuffer ? await this.readExcelFromBuffer(fileBuffer) : await this.readExcel(filePath);
      }

      return this.validateAndCleanData(data);
    } catch (error) {
      throw new Error(`Error processing file: ${error.message}`);
    }
  }

  // Get extension from buffer
  getExtensionFromBuffer(buffer) {
    // Check for Excel file signatures
    const excelSignatures = [
      [0x50, 0x4B, 0x03, 0x04], // .xlsx
      [0x50, 0x4B, 0x05, 0x06], // .xls
      [0xD0, 0xCF, 0x11, 0xE0]  // .xls (older format)
    ];
    
    const bufferStart = Array.from(buffer.slice(0, 4));
    
    for (const signature of excelSignatures) {
      if (signature.every((byte, index) => bufferStart[index] === byte)) {
        return '.xlsx';
      }
    }
    
    // Default to CSV if no Excel signature found
    return '.csv';
  }

  // Read Excel files
  async readExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with headers
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length === 0) {
        throw new Error('File is empty');
      }

      // Extract headers and data
      const headers = data[0];
      const rows = data.slice(1);

      return {
        headers,
        rows,
        totalRows: rows.length
      };
    } catch (error) {
      throw new Error(`Error reading Excel file: ${error.message}`);
    }
  }

  // Read Excel files from buffer
  async readExcelFromBuffer(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with headers
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length === 0) {
        throw new Error('File is empty');
      }

      // Extract headers and data
      const headers = data[0];
      const rows = data.slice(1);

      return {
        headers,
        rows,
        totalRows: rows.length
      };
    } catch (error) {
      throw new Error(`Error reading Excel file from buffer: ${error.message}`);
    }
  }

  // Read CSV files
  async readCSV(filePath) {
    try {
      return new Promise((resolve, reject) => {
        const results = [];
        const headers = [];
        let isFirstRow = true;
        
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => {
            if (isFirstRow) {
              headers.push(...Object.keys(data));
              isFirstRow = false;
            }
            results.push(Object.values(data));
          })
          .on('end', () => {
            if (results.length === 0) {
              reject(new Error('File is empty'));
              return;
            }
            
            resolve({
              headers,
              rows: results,
              totalRows: results.length
            });
          })
          .on('error', (error) => {
            reject(new Error(`Error reading CSV file: ${error.message}`));
          });
      });
    } catch (error) {
      throw new Error(`Error reading CSV file: ${error.message}`);
    }
  }

  // Read CSV files from buffer
  async readCSVFromBuffer(buffer) {
    try {
      return new Promise((resolve, reject) => {
        const results = [];
        const headers = [];
        let isFirstRow = true;
        
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);
        
        bufferStream
          .pipe(csv())
          .on('data', (data) => {
            if (isFirstRow) {
              headers.push(...Object.keys(data));
              isFirstRow = false;
            }
            results.push(Object.values(data));
          })
          .on('end', () => {
            if (results.length === 0) {
              reject(new Error('File is empty'));
              return;
            }
            
            resolve({
              headers,
              rows: results,
              totalRows: results.length
            });
          })
          .on('error', (error) => {
            reject(new Error(`Error reading CSV file from buffer: ${error.message}`));
          });
      });
    } catch (error) {
      throw new Error(`Error reading CSV file from buffer: ${error.message}`);
    }
  }

  // Validate and clean postal codes
  validateAndCleanData(data) {
    const { headers, rows, totalRows } = data;
    
    // Store rows for column detection
    this.rows = rows;
    
    // Find postal code column
    const postalCodeColumn = this.findPostalCodeColumn(headers);
    
    if (postalCodeColumn === -1) {
      throw new Error('No postal code column found. Please ensure your file contains a column with postal codes.');
    }

    const results = {
      headers,
      postalCodeColumn,
      totalRows,
      validPostalCodes: [],
      invalidPostalCodes: [],
      duplicates: [],
      statistics: {
        total: totalRows,
        valid: 0,
        invalid: 0,
        duplicates: 0
      }
    };

    const seenPostalCodes = new Set();

    rows.forEach((row, index) => {
      if (!row || row.length === 0) {
        results.statistics.invalid++;
        results.invalidPostalCodes.push({
          row: index + 2, // +2 because of 0-based index and header row
          value: 'Empty row',
          error: 'Empty row'
        });
        return;
      }

      const postalCode = this.extractAndCleanPostalCode(row[postalCodeColumn]);
      
      if (!postalCode) {
        results.statistics.invalid++;
        results.invalidPostalCodes.push({
          row: index + 2,
          value: row[postalCodeColumn] || 'Empty',
          error: 'Invalid postal code format'
        });
        return;
      }

      if (seenPostalCodes.has(postalCode)) {
        results.statistics.duplicates++;
        results.duplicates.push({
          row: index + 2,
          value: postalCode,
          originalValue: row[postalCodeColumn]
        });
        return;
      }

      seenPostalCodes.add(postalCode);
      results.statistics.valid++;
      results.validPostalCodes.push({
        row: index + 2,
        value: postalCode,
        originalValue: row[postalCodeColumn],
        data: row
      });
    });

    return results;
  }

  // Find the column containing postal codes
  findPostalCodeColumn(headers) {
    const postalCodeKeywords = [
      'postal', 'code', 'zip', 'postcode', 'cp', 'code postal',
      'postal_code', 'zip_code', 'postalcode', 'zipcode'
    ];

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i] ? headers[i].toString().toLowerCase() : '';
      
      if (postalCodeKeywords.some(keyword => header.includes(keyword))) {
        return i;
      }
    }

    // If no explicit postal code column found, look for columns with postal code patterns
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i] ? headers[i].toString() : '';
      
      // Check if column name looks like it might contain postal codes
      if (header.length <= 20 && /[0-9]/.test(header)) {
        return i;
      }
    }

    // If still no match, try to find a column that contains postal code patterns in the data
    if (headers.length > 0 && this.rows && this.rows.length > 0) {
      for (let i = 0; i < headers.length; i++) {
        // Check first few rows for postal code patterns
        const sampleValues = this.rows.slice(0, 5).map(row => row[i]).filter(val => val);
        const hasPostalCodes = sampleValues.some(val => {
          const cleaned = this.extractAndCleanPostalCode(val);
          return cleaned && /^\d{4,6}$/.test(cleaned);
        });
        
        if (hasPostalCodes) {
          return i;
        }
      }
    }

    // Last resort: return the first column if it exists
    return headers.length > 0 ? 0 : -1;
  }

  // Extract and clean postal code
  extractAndCleanPostalCode(value) {
    if (!value) return null;

    // Convert to string and clean
    let postalCode = value.toString().trim();
    
    // Remove common prefixes/suffixes
    postalCode = postalCode.replace(/^(cp|code|postal|zip)\s*:?\s*/i, '');
    postalCode = postalCode.replace(/\s*\(.*?\)/g, ''); // Remove parentheses content
    
    // Remove spaces and common separators
    postalCode = postalCode.replace(/[\s\-_\.]/g, '');
    
    // Remove non-numeric characters (except for some international formats)
    postalCode = postalCode.replace(/[^\d]/g, '');
    
    // Handle leading zeros (US ZIP codes like 00001, 00002)
    if (postalCode.startsWith('0') && postalCode.length === 5) {
      // Keep as is for US ZIP codes
      return postalCode;
    }
    
    // Validate French postal codes (5 digits)
    if (/^\d{5}$/.test(postalCode)) {
      return postalCode;
    }
    
    // Validate other common formats (4-6 digits)
    if (/^\d{4,6}$/.test(postalCode)) {
      return postalCode;
    }

    return null;
  }

  // Generate preview data (first 50 rows)
  generatePreview(data, maxRows = 50) {
    const preview = {
      headers: data.headers,
      rows: data.validPostalCodes.slice(0, maxRows),
      totalRows: data.validPostalCodes.length,
      previewRows: Math.min(maxRows, data.validPostalCodes.length)
    };

    return preview;
  }

  // Save processed data to database
  async saveToDatabase(projectId, processedData, db) {
    const { validPostalCodes } = processedData;
    
    const insertPromises = validPostalCodes.map(postalCode => {
      return db.query(
        `INSERT INTO postal_codes (project_id, postal_code, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [projectId, postalCode.value, 'pending']
      );
    });

    await Promise.all(insertPromises);
    
    return {
      success: true,
      savedCount: validPostalCodes.length
    };
  }

  // Clean up uploaded file
  async cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}

module.exports = new FileProcessor();
