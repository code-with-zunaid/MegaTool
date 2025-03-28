import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiUploadCloud, FiDownload, FiFile } from 'react-icons/fi';
import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.js',
  import.meta.url
).toString();

const PdfExtractor = () => {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [processedPdf, setProcessedPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  // Load PDF and generate previews
  const loadPdf = useCallback(async (file) => {
    try {
      console.log('[Extractor] Loading PDF:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      const pageData = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: canvas.getContext('2d'),
          viewport
        }).promise;

        pageData.push({
          number: i,
          thumbnail: canvas.toDataURL()
        });
      }

      console.log(`[Extractor] Generated ${pageData.length} previews`);
      setPages(pageData);
    } catch (err) {
      console.error('[Extractor] PDF loading error:', err);
      setError('Failed to load PDF previews');
    }
  }, []);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFile(file);
    setSelectedPages([]);
    setError('');
    await loadPdf(file);
  }, [loadPdf]);

  const togglePage = useCallback((pageNumber) => {
    setSelectedPages(prev => prev.includes(pageNumber)
      ? prev.filter(p => p !== pageNumber)
      : [...prev, pageNumber]
    );
  }, []);

  const extractPages = async () => {
    if (!file || selectedPages.length === 0) {
      setError('Please select pages to extract');
      return;
    }
  
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('pages', selectedPages.sort((a, b) => a - b).join(','));
  
      console.log('[Extractor] Sending extraction request for pages:', selectedPages);
      console.log('Request URL:', `${import.meta.env.VITE_API_BASE_URL}/api/v1/pdf/ToExtractPagesFromPdf`);
  
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/pdf/ToExtractPagesFromPdf`,
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000,
          validateStatus: (status) => status < 500 // Consider all 5xx as errors
        }
      );
  
      console.log('[Extractor] Raw server response:', data);
  
      if (!data || data.statusCode >= 400) {
        throw new Error(data?.message || 'Invalid server response structure');
      }
  
      if (!data.data?.processedPdf) {
        throw new Error('Missing PDF data in server response');
      }
  
      setProcessedPdf({
        base64: data.data.processedPdf,
        fileName: data.data.fileName || `extracted-pages-${Date.now()}.pdf`
      });
      setError('');
    } catch (err) {
      console.error('[Extractor] Extraction failed:', {
        error: err.message,
        status: err.response?.status,
        requestConfig: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        },
        serverResponse: err.response?.data
      });
  
      let errorMessage = 'Failed to process request';
      if (err.response) {
        errorMessage = err.response.status === 404
          ? 'Service endpoint not found - contact support'
          : err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out - try again';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Connection failed - check your network';
      }
  
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!processedPdf) return;

    try {
      const byteArray = Uint8Array.from(atob(processedPdf.base64), c => c.charCodeAt(0));
      saveAs(new Blob([byteArray], { type: 'application/pdf' }), processedPdf.fileName);
      console.log('[Extractor] Download successful');
    } catch (err) {
      console.error('[Extractor] Download error:', err);
      setError('Failed to generate download');
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

        {pages.length > 0 && (
          <div className="preview-container">
            <h3>Select Pages to Extract ({pages.length} total)</h3>
            <div className="preview-grid">
            {pages.map(page => (
                <div 
                key={page.number}
                className={`preview-item ${selectedPages.includes(page.number) ? 'selected' : ''}`}
                onClick={() => togglePage(page.number)}
                >
                <input
                    type="checkbox"
                    className="page-selector"
                    checked={selectedPages.includes(page.number)}
                    onChange={() => {}}
                />
                <img 
                    src={page.thumbnail} 
                    alt={`Page ${page.number}`}
                    className="thumbnail"
                />
                <span className="page-number">Page {page.number}</span>
                </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="action-buttons">
        <button 
          className={`convert-btn ${loading ? 'loading' : ''}`}
          onClick={extractPages}
          disabled={loading || selectedPages.length === 0}
        >
          {loading ? 'Extracting...' : 'Extract Selected Pages'}
        </button>

        {processedPdf && (
          <button className="download-btn" onClick={downloadPdf}>
            <FiDownload /> Download Extracted PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfExtractor;