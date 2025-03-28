// // src/components/PdfTools/PdfTools.jsx
// import { useState } from 'react';
// import { PdfConverter,
//    PdfSplitter,
//     PdfMerger,
//     PdfPageRemover,
//     ExtractPage,
//     PdfProtector,
    
//     } from './index';
// import './PdfTools.css';

// const PdfTools = () => {
//   const [activeTool, setActiveTool] = useState('convert');

//   return (
//     <div className="pdf-tools-container">
//       <h1 className="pdf-main-title">PDF Master Suite</h1>
      
//       <nav className="pdf-tool-nav">
//         <button 
//           className={`tool-btn ${activeTool === 'convert' ? 'active' : ''}`}
//           onClick={() => setActiveTool('convert')}
//         >
//           🖼️ Convert to PDF
//         </button>
//         <button 
//           className={`tool-btn ${activeTool === 'split' ? 'active' : ''}`}
//           onClick={() => setActiveTool('split')}
//         >
//           ✂️ Split PDF
//         </button>
//         <button 
//           className={`tool-btn ${activeTool === 'merge' ? 'active' : ''}`}
//           onClick={() => setActiveTool('merge')}
//         >
//           🧩 Merge PDFs
//         </button>
//         <button 
//           className={`tool-btn ${activeTool === 'remove' ? 'active' : ''}`}
//           onClick={() => setActiveTool('remove')}
//         >
//           🗑️ Remove Pages
//         </button>
//         <button 
//           className={`tool-btn ${activeTool === 'extract' ? 'active' : ''}`}
//           onClick={() => setActiveTool('extract')}
//         >
//           📑 Extract Pages
//         </button>

//         <button 
//           className={`tool-btn ${activeTool === 'protector' ? 'active' : ''}`}
//           onClick={() => setActiveTool('protector')}
//         >
//           Pdf Protector
//         </button>
//       </nav>

//       <div className="tool-content">
//         {activeTool === 'convert' && <PdfConverter />}
//         {activeTool === 'split' && <PdfSplitter />}
//         {activeTool === 'merge' && <PdfMerger />}
//         {activeTool === 'remove' && <PdfPageRemover />}
//         {activeTool === 'extract' && <ExtractPage/>}
//         {activeTool === 'protector' && <PdfProtector/>}
//       </div>

//       <footer className="pdf-footer">
//         <p>🛡️ Secure Processing - Files deleted automatically after 1 hour</p>
//         <p>⚡ Supports PDFs up to 500MB</p>
//       </footer>
//     </div>
//   );
// };

// export default PdfTools;

// src/components/PdfTools/PdfTools.jsx
import { useState } from 'react';
import { PdfConverter,
   PdfSplitter,
    PdfMerger,
    PdfPageRemover,
    ExtractPage,
    PdfProtector,
    
    } from './index';
import './PdfTools.css';

const PdfTools = () => {
  const [activeTool, setActiveTool] = useState('convert');

  return (
    <div className="flex flex-col items-center bg-gray-100 p-4 md:p-5">
      <h1 className="pdf-main-title">PDF Master Suite</h1>
      
      <nav className="pdf-tool-nav">
        <div className="tool-btn-group">
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
          <button 
            className={`tool-btn ${activeTool === 'remove' ? 'active' : ''}`}
            onClick={() => setActiveTool('remove')}
          >
            🗑️ Remove Pages
          </button>
          <button 
            className={`tool-btn ${activeTool === 'extract' ? 'active' : ''}`}
            onClick={() => setActiveTool('extract')}
          >
            📑 Extract Pages
          </button>
          <button 
            className={`tool-btn ${activeTool === 'protector' ? 'active' : ''}`}
            onClick={() => setActiveTool('protector')}
          >
            🔒 Pdf Protector
          </button>
        </div>
      </nav>

      <div className="tool-content">
        {activeTool === 'convert' && <PdfConverter />}
        {activeTool === 'split' && <PdfSplitter />}
        {activeTool === 'merge' && <PdfMerger />}
        {activeTool === 'remove' && <PdfPageRemover />}
        {activeTool === 'extract' && <ExtractPage/>}
        {activeTool === 'protector' && <PdfProtector/>}
      </div>

      <footer className="pdf-footer">
        <p>🛡️ Secure Processing - Files deleted automatically after 1 hour</p>
        <p>⚡ Supports PDFs up to 500MB</p>
      </footer>
    </div>
  );
};

export default PdfTools;
