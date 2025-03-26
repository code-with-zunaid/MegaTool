// src/components/PdfTools/PdfTools.jsx
import { useState } from 'react';
import { PdfConverter, PdfSplitter, PdfMerger } from './index';
import './PdfTools.css';

const PdfTools = () => {
  const [activeTool, setActiveTool] = useState('convert');

  return (
    <div className="pdf-tools-container">
      <h1 className="pdf-main-title">PDF Master Suite</h1>
      
      <nav className="pdf-tool-nav">
        <button 
          className={`tool-btn ${activeTool === 'convert' ? 'active' : ''}`}
          onClick={() => setActiveTool('convert')}
        >
          🖼️ Convert to PDF
        </button>
        <button 
          className={`tool-btn ${activeTool === 'split' ? 'active' : ''}`}
          onClick={() => setActiveTool('split')}
        >
          ✂️ Split PDF
        </button>
        <button 
          className={`tool-btn ${activeTool === 'merge' ? 'active' : ''}`}
          onClick={() => setActiveTool('merge')}
        >
          🧩 Merge PDFs
        </button>
      </nav>

      <div className="tool-content">
        {activeTool === 'convert' && <PdfConverter />}
        {activeTool === 'split' && <PdfSplitter />}
        {activeTool === 'merge' && <PdfMerger />}
      </div>
    </div>
  );
};

export default PdfTools;