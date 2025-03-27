// src/components/PdfTools/PdfConverter.jsx
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiUploadCloud, FiDownload, FiFile, FiX } from 'react-icons/fi';
import './PdfTools.css';

// Enable debug mode from environment variables
const DEBUG_MODE = import.meta.env.VITE_DEBUG === 'true';

const PdfConverter = () => {
  const [files, setFiles] = useState([]);
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversionTime, setConversionTime] = useState(0);

  // Component lifecycle debugging
  useEffect(() => {
    DEBUG_MODE && console.group("🔄 Component Mounted/Updated");
    DEBUG_MODE && console.log("📦 Current Files:", files);
    DEBUG_MODE && console.log("📄 PDF Data:", pdfData);
    DEBUG_MODE && console.log("⏳ Loading State:", loading);
    DEBUG_MODE && console.groupEnd();
  }, [files, pdfData, loading]);

  const log = (...args) => DEBUG_MODE && console.log(...args);

  const handleFileUpload = useCallback((e) => {
    log("📂 File Input Event:", e);
    const newFiles = Array.from(e.target.files);
    log("➕ New Files Selected:", newFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: `${(f.size / 1024).toFixed(2)}KB`
    })));

    if (newFiles.length === 0) {
      console.warn("⚠️ Empty File Selection");
      return;
    }

    setFiles(prev => {
      const updatedFiles = [...prev, ...newFiles];
      log("📁 Total Files:", updatedFiles.length);
      return updatedFiles;
    });
    setError('');
  }, []);

  const removeFile = useCallback((index) => {
    log("🗑️ Remove File Request:", index);
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      log("➖ Remaining Files:", newFiles.map(f => f.name));
      return newFiles;
    });
  }, []);

  const convertToPdf = async () => {
    const debugTag = "[Frontend Conversion]";
    const startTime = performance.now();
    let conversionStages = {};
    
    try {
      console.log(`${debugTag} Initiated with ${files.length} files`);
      conversionStages.start = performance.now();
  
      // Validation
      if (!files.length) {
        console.error(`${debugTag} No files selected`);
        setError('Please select images to convert');
        return;
      }
  
      // Prepare upload
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file);
        console.log(`${debugTag} Added file ${index}: ${file.name} (${file.type})`);
      });
  
      conversionStages.formDataReady = performance.now();
  
      // API Request
      console.log(`${debugTag} Sending to: ${import.meta.env.VITE_API_BASE_URL}`);
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/pdf/ToPDF`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 45000,
          onUploadProgress: progress => {
            console.log(`${debugTag} Upload progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
          }
        }
      );
  
      conversionStages.apiResponse = performance.now();
  
      // Validate response structure
      if (!response.data?.data?.pdf || !response.data.data.fileName) {
        console.error(`${debugTag} Invalid response format:`, response.data);
        throw new Error("Server returned unexpected format");
      }
  
      // Process response
      const { pdf, fileName, metrics } = response.data.data;
      console.log(`${debugTag} Received PDF: ${pdf.length} chars, ${fileName}`);
      console.log(`${debugTag} Conversion metrics:`, metrics);
  
      setPdfData({ base64: pdf, fileName });
      setError('');
      
      // Analytics
      conversionStages.complete = performance.now();
      console.table({
        'Form Preparation': `${conversionStages.formDataReady - conversionStages.start}ms`,
        'API Response Time': `${conversionStages.apiResponse - conversionStages.formDataReady}ms`,
        'Total Duration': `${conversionStages.complete - conversionStages.start}ms`,
        'PDF Size': `${Math.round(metrics.pdfSize / 1024)}KB`,
        'Compression Ratio': metrics.compressionRatio
      });
  
    } catch (error) {
      // Detailed error analysis
      const errorInfo = {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
        response: error.response?.data,
        files: files.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        }))
      };
  
      console.error(`${debugTag} Failure Analysis:`, errorInfo);
      
      setError(error.response?.data?.message || 
        error.message || 
        "Conversion failed. Please check files and try again."
      );
  
      // Error recovery
      if (error.response?.status === 413) {
        console.warn(`${debugTag} Payload too large - suggest smaller files`);
      }
    } finally {
      setLoading(false);
      console.log(`${debugTag} Process completed in ${performance.now() - startTime}ms`);
    }
  };

  const downloadPdf = () => {
    if (!pdfData) {
      console.warn("⚠️ Download Attempt Without PDF Data");
      return;
    }

    try {
      log("📥 PDF Download Initiated:", {
        fileName: pdfData.fileName,
        base64Length: pdfData.base64.length
      });

      const byteArray = new Uint8Array(
        atob(pdfData.base64)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      log("🔢 Byte Array Created:", {
        length: byteArray.length,
        firstBytes: Array.from(byteArray.slice(0, 4))
      });

      const blob = new Blob([byteArray], { type: 'application/pdf' });
      log("📄 PDF Blob Created:", {
        size: blob.size,
        type: blob.type
      });

      saveAs(blob, pdfData.fileName);
      log("✅ PDF Successfully Downloaded");

      // Analytics
      console.info("📊 Conversion Metrics:", {
        fileCount: files.length,
        conversionTime,
        pdfSize: blob.size
      });

      setFiles([]);
      setPdfData(null);
      log("🔄 State Reset After Download");
    } catch (error) {
      console.error("🚨 Download Failed:", error);
      setError('Failed to generate download');
    }
  };


  return (
    <div className="converter-container">
      <div className="file-upload-card">
        <label className="upload-area">
          <FiUploadCloud className="upload-icon" />
          <span>Drag & Drop or Click to Upload</span>
          <input 
            type="file" 
            multiple 
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden-input"
          />
        </label>

        {files.length > 0 && (
          <div className="file-preview">
            <h3 className="file-list-title">Selected Files:</h3>
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <FiFile className="file-icon" />
                <span className="file-name">{file.name}</span>
                <button 
                  onClick={() => removeFile(index)}
                  className="remove-btn"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error-banner">❌ {error}</div>}

      <div className="action-buttons">
        <button 
          className={`convert-btn ${loading ? 'loading' : ''}`}
          onClick={convertToPdf}
          disabled={loading || !files.length}
        >
          {loading ? 'Converting...' : 'Convert to PDF'}
        </button>

        {pdfData && (
          <button className="download-btn" onClick={downloadPdf}>
            <FiDownload /> Download PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfConverter;
