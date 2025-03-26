import { useState, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiUploadCloud, FiScissors, FiDownload } from 'react-icons/fi';
import './PdfTools.css';

const PdfSplitter = () => {
  const [file, setFile] = useState(null);
  const [splitRanges, setSplitRanges] = useState('');
  const [splitResults, setSplitResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a valid PDF file');
    }
  }, []);

  const splitPdf = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('ranges', splitRanges);

      const { data } = await axios.post('/api/pdf/split', formData);
      
      setSplitResults(data.splitFiles);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to split PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadSplit = (base64, fileName) => {
    const byteArray = new Uint8Array(
      atob(base64)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    saveAs(new Blob([byteArray], { type: 'application/pdf' }), fileName);
  };

  return (
    <div className="converter-container">
      <div className="file-upload-card">
        <label className="upload-area">
          <FiUploadCloud className="upload-icon" />
          <span>Select PDF to Split</span>
          <input 
            type="file" 
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden-input"
          />
        </label>

        {file && (
          <div className="file-preview">
            <div className="file-item">
              <span className="file-name">{file.name}</span>
            </div>
          </div>
        )}
      </div>

      <div className="split-controls">
        <div className="form-group">
          <label>Split Pages (e.g., 1-3,4-6)</label>
          <input
            type="text"
            value={splitRanges}
            onChange={(e) => setSplitRanges(e.target.value)}
            placeholder="Enter page ranges separated by commas"
          />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="action-buttons">
        <button 
          className={`convert-btn ${loading ? 'loading' : ''}`}
          onClick={splitPdf}
          disabled={loading || !file}
        >
          <FiScissors /> {loading ? 'Splitting...' : 'Split PDF'}
        </button>
      </div>

      {splitResults.length > 0 && (
        <div className="results-container">
          <h3>Split Results:</h3>
          {splitResults.map((result, index) => (
            <div key={index} className="result-item">
              <span>Part {index + 1} ({result.pages} pages)</span>
              <button 
                className="download-btn"
                onClick={() => downloadSplit(result.data, result.fileName)}
              >
                <FiDownload /> Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfSplitter;