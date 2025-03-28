import { useState, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiUploadCloud, FiDownload, FiFile } from 'react-icons/fi';
import './PdfTools.css';

const PdfMerger = () => {
  const [files, setFiles] = useState([]);
  const [mergedPdf, setMergedPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = useCallback((e) => {
    const newFiles = Array.from(e.target.files).filter(file => 
      file.type === 'application/pdf'
    );
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  }, []);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const mergePdfs = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('pdfs', file);
        console.log(`Added PDF ${index + 1}:`, file.name, file.size, file.type);
      });

      console.log('Sending merge request with', files.length, 'PDFs');
      
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pdf/ToMergePdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      console.log('Merge response:', data);
      
      if (!data?.data?.mergedPdf) {
        throw new Error('Invalid response structure from server');
      }

      setMergedPdf({
        base64: data.data.mergedPdf,
        fileName: data.data.fileName
      });
      setError('');
    } catch (err) {
      console.error('Merge error:', err);
      const serverError = err.response?.data?.message;
      const errorMessage = serverError || err.message || 'Failed to merge PDFs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadMerged = () => {
    if (!mergedPdf) return;
    
    try {
      const binaryString = atob(mergedPdf.base64);
      const byteArray = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }
      
      saveAs(new Blob([byteArray], { type: 'application/pdf' }), mergedPdf.fileName);
      console.log('Downloaded merged PDF:', mergedPdf.fileName);
      setFiles([]);
      setMergedPdf(null);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to generate downloadable file');
    }
  };

  

  return (
    <div className="converter-container">
      <div className="file-upload-card">
        <label className="upload-area">
          <FiUploadCloud className="upload-icon" />
          <span>Select PDFs to Merge</span>
          <input 
            type="file" 
            multiple 
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden-input"
          />
        </label>

        {files.length > 0 && (
          <div className="file-preview">
            <h3 className="file-list-title">Selected PDFs:</h3>
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <FiFile className="file-icon" />
                <span className="file-name">{file.name}</span>
                <button 
                  onClick={() => removeFile(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="action-buttons">
        <button 
          className={`convert-btn ${loading ? 'loading' : ''}`}
          onClick={mergePdfs}
          disabled={loading || files.length < 2}
        >
          {loading ? 'Merging...' : 'Merge PDFs'}
        </button>

        {mergedPdf && (
          <button className="download-btn" onClick={downloadMerged}>
            <FiDownload /> Download Merged PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfMerger;