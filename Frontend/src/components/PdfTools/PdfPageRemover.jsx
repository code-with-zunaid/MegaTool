import { useState, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiUploadCloud, FiDownload, FiTrash2 } from 'react-icons/fi';
import './PdfTools.css';



import * as pdfjs from 'pdfjs-dist'; // Add this import
import 'pdfjs-dist/build/pdf.worker'; // Add worker initialization

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;


const PdfPageRemover = () => {
  const [file, setFile] = useState(null);
  const [pagesToRemove, setPagesToRemove] = useState([]);
  const [processedPdf, setProcessedPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);

  const handleFileUpload = useCallback(async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      console.log('[Frontend] File selected:', selectedFile.name, selectedFile.size);
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      console.log('[Frontend] File read as ArrayBuffer');

      // Use pdfjs properly
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      console.log(`[Frontend] PDF contains ${numPages} pages`);

      setFile(selectedFile);
      setTotalPages(numPages);
      setPagesToRemove([]);
      setError('');
    } catch (err) {
      console.error('[Frontend] File processing error:', err);
      setError('Invalid PDF file - Please upload a valid PDF document');
    }
  }, []);

  // Add bulk selection features
const selectAll = useCallback(() => {
  setPagesToRemove(Array.from({ length: totalPages }, (_, i) => i + 1));
}, [totalPages]);

const clearSelection = useCallback(() => {
  setPagesToRemove([]);
}, []);




  const togglePage = useCallback((pageNumber) => {
    setPagesToRemove(prev => 
      prev.includes(pageNumber)
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber]
    );
  }, []);


  const removePages = async () => {
    console.log('[Frontend] Remove pages triggered');
    
    if (!file) {
      console.warn('[Frontend] No file selected');
      setError('Please select a PDF file first');
      return;
    }
    
    if (pagesToRemove.length === 0) {
      console.warn('[Frontend] No pages selected for removal');
      setError('Please select at least one page to remove');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('pages', pagesToRemove.sort((a,b) => a-b).join(','));

      // Log FormData contents
      console.log('[Frontend] Sending FormData with:');
      for (const [key, value] of formData.entries()) {
        console.log(`- ${key}:`, value);
      }

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/pdf/ToRemovePageFromPdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30-second timeout
      });

      console.log('[Frontend] Server response:', response.data);
      
      if (!response.data?.data?.processedPdf) {
        throw new Error('Invalid response structure from server');
      }

      setProcessedPdf({
        base64: response.data.data.processedPdf,
        fileName: response.data.data.fileName
      });
      setError('');
    } catch (err) {
      console.error('[Frontend] API Error:', {
        message: err.message,
        response: err.response?.data,
        stack: err.stack
      });
      
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to process PDF. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    try {
      if (!processedPdf?.base64) {
        throw new Error('No processed PDF available');
      }

      console.log('[Frontend] Starting PDF download');
      
      const binaryString = atob(processedPdf.base64);
      const byteArray = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([byteArray], { type: 'application/pdf' });
      saveAs(blob, processedPdf.fileName);
      console.log('[Frontend] PDF download completed');
      
    } catch (error) {
      console.error('[Frontend] Download failed:', error);
      setError('Failed to generate downloadable file');
    }
  };
  return (
    <div className="converter-container">
      <div className="file-upload-card">
        <label className="upload-area">
          <FiUploadCloud className="upload-icon" />
          <span>Select PDF File</span>
          <input 
            type="file" 
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden-input"
          />
        </label>

        {file && (
          <div className="page-selection">
            <h3>Select Pages to Remove ({totalPages} total pages)</h3>
            <div className="page-grid">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i+1}
                  className={`page-btn ${pagesToRemove.includes(i+1) ? 'selected' : ''}`}
                  onClick={() => togglePage(i+1)}
                >
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="action-buttons">
        <button 
          className={`convert-btn ${loading ? 'loading' : ''}`}
          onClick={removePages}
          disabled={loading || !file || pagesToRemove.length === 0}
        >
          <FiTrash2 /> {loading ? 'Processing...' : 'Remove Pages'}
        </button>

        
        <div className="bulk-actions">
          <button onClick={selectAll}>Select All</button>
          <button onClick={clearSelection}>Clear Selection</button>
        </div>

        {processedPdf && (
          <button className="download-btn" onClick={downloadPdf}>
            <FiDownload /> Download Modified PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfPageRemover;