// src/components/PdfTools/PdfConverter.jsx
import { useState, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiUploadCloud, FiDownload, FiFile, FiX } from 'react-icons/fi';
import './PdfTools.css';

const PdfConverter = () => {
  const [files, setFiles] = useState([]);
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log("📌 Component Rendered!"); // Logs when the component is re-rendered

  const handleFileUpload = useCallback((e) => {
    console.log("📤 File input triggered!");
    const newFiles = Array.from(e.target.files);
    console.log("📝 Selected files:", newFiles);

    if (newFiles.length === 0) {
      console.warn("⚠️ No files selected!");
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  }, []);

  const removeFile = useCallback((index) => {
    console.log(`🗑 Removing file at index: ${index}`);
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const convertToPdf = async () => {
    console.log("🚀 Convert to PDF button clicked!");
    
    if (!files.length) {
      console.warn("⚠️ No files selected for conversion.");
      setError('Please select at least one image');
      return;
    }

    setLoading(true);
    console.log("⏳ Conversion started...");

    try {
      const formData = new FormData();
      files.forEach(file => {
        console.log(`📎 Appending file: ${file.name}`);
        formData.append('images', file);
      });

      console.log("📡 Sending request to server...");
      const { data } = await axios.post(
        `http://localhost:4000/api/v1/pdf/ToPDF`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("✅ Server Response:", data);

      if (!data.pdf || !data.fileName) {
        console.error("❌ Invalid response from server");
        throw new Error("Server did not return a valid PDF.");
      }

      setPdfData({
        base64: data.pdf,
        fileName: data.fileName
      });

      setError('');
      console.log("🎉 Conversion successful!");
    } catch (err) {
      console.error("🚨 Conversion failed:", err);
      setError(err.response?.data?.error || 'Conversion failed');
    } finally {
      setLoading(false);
      console.log("✅ Conversion process completed!");
    }
  };

  const downloadPdf = () => {
    if (!pdfData) {
      console.warn("⚠️ No PDF available to download.");
      return;
    }

    console.log("📥 Downloading PDF...");
    const byteArray = new Uint8Array(
      atob(pdfData.base64)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    saveAs(new Blob([byteArray], { type: 'application/pdf' }), pdfData.fileName);
    console.log("✅ PDF Downloaded:", pdfData.fileName);

    setFiles([]);
    setPdfData(null);
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
