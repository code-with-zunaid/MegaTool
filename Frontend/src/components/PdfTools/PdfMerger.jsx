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
      files.forEach(file => formData.append('pdfs', file));

      const { data } = await axios.post('/api/pdf/merge', formData);
      
      setMergedPdf({
        base64: data.mergedPdf,
        fileName: data.fileName
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to merge PDFs');
    } finally {
      setLoading(false);
    }
  };

  const downloadMerged = () => {
    if (!mergedPdf) return;
    
    const byteArray = new Uint8Array(
      atob(mergedPdf.base64)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    saveAs(new Blob([byteArray], { type: 'application/pdf' }), mergedPdf.fileName);
    setFiles([]);
    setMergedPdf(null);
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