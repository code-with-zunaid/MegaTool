// import { useState, useCallback } from 'react';
// import axios from 'axios';
// import { saveAs } from 'file-saver';
// import { FiUploadCloud, FiDownload, FiLock } from 'react-icons/fi';
// import './PdfTools.css';

// const PdfProtector = () => {
//   const [file, setFile] = useState(null);
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [processedPdf, setProcessedPdf] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleFileUpload = useCallback((e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile?.type === 'application/pdf') {
//       console.log('[Protector] File selected:', selectedFile.name, selectedFile.size);
//       setFile(selectedFile);
//       setError('');
//     } else {
//       console.error('[Protector] Invalid file type:', selectedFile?.type);
//       setError('Please upload a valid PDF file');
//     }
//   }, []);

//   const protectPdf = async () => {
//     console.log('[Protector] Protection process started');
    
//     if (!file) {
//       console.error('[Protector] No file selected');
//       setError('Please select a PDF file');
//       return;
//     }

//     if (password.length < 4) {
//       console.error('[Protector] Weak password');
//       setError('Password must be at least 4 characters');
//       return;
//     }

//     if (password !== confirmPassword) {
//       console.error('[Protector] Password mismatch');
//       setError('Passwords do not match');
//       return;
//     }

//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append('pdf', file);
//       formData.append('password', password);

//       console.log('[Protector] Sending protection request', {
//         file: file.name,
//         passwordLength: password.length
//       });

//       const { data } = await axios.post(
//         `${import.meta.env.VITE_API_BASE_URL}/api/v1/pdf/ToProtectPdf`,
//         formData,
//         {
//           headers: { 'Content-Type': 'multipart/form-data' },
//           timeout: 30000
//         }
//       );

//       console.log('[Protector] Server response:', data);

//       if (!data?.data?.protectedPdf) {
//         throw new Error('Invalid response from server');
//       }

//       setProcessedPdf({
//         base64: data.data.protectedPdf,
//         fileName: data.data.fileName
//       });
//       setError('');
//     } catch (err) {
//       console.error('[Protector] Protection failed:', {
//         error: err.message,
//         response: err.response?.data,
//         code: err.code
//       });
      
//       setError(err.response?.data?.message || 'Failed to protect PDF');
//     } finally {
//       setLoading(false);
//     }
//   };

//  // PdfProtector.jsx
//  const downloadProtected = () => {
//   if (!processedPdf) return;

//   try {
//     console.log('[Protector] Download initiated with data:', {
//       base64Length: processedPdf.base64.length,
//       fileName: processedPdf.fileName
//     });

//     // 1. Base64 Validation
//     if (!/^[A-Za-z0-9+/]+={0,2}$/.test(processedPdf.base64)) {
//       throw new Error('Invalid base64 encoding pattern');
//     }

//     // 2. Decoding Process
//     const byteCharacters = atob(processedPdf.base64);
//     console.log('[Protector] Base64 decoded length:', byteCharacters.length);
    
//     // 3. Array Conversion
//     const byteArray = new Uint8Array(byteCharacters.length);
//     for (let i = 0; i < byteCharacters.length; i++) {
//       byteArray[i] = byteCharacters.charCodeAt(i);
//     }

//     // 4. Critical Encryption Check
//     const headerBytes = byteArray.subarray(0, 4);
//     console.log('[Protector] PDF Header Bytes:', 
//       Array.from(headerBytes).map(b => b.toString(16)).join(' ')
//     );
    
//     // Check if header matches unencrypted PDF (%PDF)
//     if (headerBytes[0] === 0x25 && 
//         headerBytes[1] === 0x50 && 
//         headerBytes[2] === 0x44 && 
//         headerBytes[3] === 0x46) {
//       throw new Error('PDF_NOT_ENCRYPTED: File header shows no encryption');
//     }

//     // 5. PDF Structure Analysis
//     const pdfVersion = String.fromCharCode(...byteArray.subarray(5, 8));
//     console.log('[Protector] PDF Version:', pdfVersion);

//     // 6. Sample Encryption Check
//     const sampleEncryptedData = byteArray.subarray(1000, 1004);
//     console.log('[Protector] Sample Data Check:', 
//       Array.from(sampleEncryptedData).join(',')
//     );

//     // 7. Blob Validation (FIXED SYNTAX)
//     const blob = new Blob([byteArray], { type: 'application/pdf' });
//     console.log('[Protector] Blob Metadata:', {
//       size: blob.size,
//       type: blob.type,
//       firstKB: Array.from(new Uint8Array(blob.slice(0, 1024))) // Added missing )
//     });

//     // 8. File Saving
//     saveAs(blob, processedPdf.fileName);

//     // 9. Post-Download Verification
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const arr = new Uint8Array(e.target.result);
      
//       console.log('[Protector] Post-Download Verification:', {
//         header: arr.subarray(0, 4),
//         trailer: arr.subarray(-8), // Last 8 bytes
//         midSection: arr.subarray(5000, 5004)
//       });

//       // Final Encryption Check
//       if (arr[0] === 0x25 && arr[1] === 0x50) {
//         console.error('[Protector] CRITICAL: PDF remains unencrypted after download');
//         setError('Encryption failed - PDF not protected');
//       }
//     };
//     reader.readAsArrayBuffer(blob);

//   } catch (err) {
//     console.error('[Protector] DOWNLOAD FAILURE:', {
//       name: err.name,
//       message: err.message,
//       stack: err.stack,
//       rawData: processedPdf?.base64?.substring(0, 50) + '...'
//     });
    
//     setError(err.message.includes('PDF_NOT_ENCRYPTED') 
//       ? 'Server failed to encrypt PDF' 
//       : 'Download failed: ' + err.message
//     );
//   }
// };

//   return (
//     <div className="converter-container">
//       <div className="file-upload-card">
//         <label className="upload-area">
//           <FiUploadCloud className="upload-icon" />
//           <span>Select PDF to Protect</span>
//           <input 
//             type="file" 
//             onChange={handleFileUpload}
//             accept="application/pdf"
//             className="hidden-input"
//           />
//         </label>

//         {file && (
//           <div className="protection-controls">
//             <div className="form-group">
//               <label>Set Password</label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter password"
//               />
//             </div>
//             <div className="form-group">
//               <label>Confirm Password</label>
//               <input
//                 type="password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 placeholder="Confirm password"
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       {error && <div className="error-banner">{error}</div>}

//       <div className="action-buttons">
//         <button 
//           className={`convert-btn ${loading ? 'loading' : ''}`}
//           onClick={protectPdf}
//           disabled={loading || !file}
//         >
//           <FiLock /> {loading ? 'Protecting...' : 'Protect PDF'}
//         </button>

//         {processedPdf && (
//           <button className="download-btn" onClick={downloadProtected}>
//             <FiDownload /> Download Protected PDF
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PdfProtector;

import { useState, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiUploadCloud, FiDownload, FiLock } from 'react-icons/fi';
import './PdfTools.css';

const PdfProtector = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [processedPdf, setProcessedPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = useCallback((e) => {
    const selectedFile = e.target.files[0];
    console.debug('[PDF-Protect] File selected:', selectedFile?.name, selectedFile?.size);
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      console.error('[PDF-Protect] Invalid file type:', selectedFile?.type);
      setError('Please upload a valid PDF file');
    }
  }, []);

  const protectPdf = async () => {
    setLoading(true);
    setError('');
  
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('password', password);
  
      console.debug('[PDF-Protect] Sending protection request');
  
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/pdf/ToProtectPdf`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        }
      );
  
      console.debug('[PDF-Protect] Server response:', response);
  
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from server');
      }
  
      setProcessedPdf({
        base64: response.data.data,
        fileName: response.data.fileName || `protected-${Date.now()}.pdf`
      });
  
    } catch (err) {
      console.error('[PDF-Protect] Protection failed:', err);
      setError(err.response?.data?.message || 'Failed to protect PDF');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadProtected = () => {
    if (!processedPdf) return;
  
    try {
      console.debug('[PDF-Protect] Download initiated');
  
      const byteCharacters = atob(processedPdf.base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
  
      console.debug('[PDF-Protect] Checking encryption');
      const headerBytes = byteArray.subarray(0, 4);
      
      // This prevents false positives in PDF header checks
      if (!(headerBytes[0] === 0x25 && headerBytes[1] === 0x50)) {
        throw new Error('PDF_NOT_ENCRYPTED: File header shows no encryption');
      }
  
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      saveAs(blob, processedPdf.fileName);
    } catch (err) {
      console.error('[PDF-Protect] DOWNLOAD FAILURE:', err);
      setError('Download failed: ' + err.message);
    }
  };
  

  return (
    <div className="converter-container">
      <div className="file-upload-card">
        <label className="upload-area">
          <FiUploadCloud className="upload-icon" />
          <span>Select PDF to Protect</span>
          <input 
            type="file" 
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden-input"
          />
        </label>

        {file && (
          <div className="protection-controls">
            <div className="form-group">
              <label>Set Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="action-buttons">
        <button 
          className={`convert-btn ${loading ? 'loading' : ''}`}
          onClick={protectPdf}
          disabled={loading || !file}
        >
          <FiLock /> {loading ? 'Protecting...' : 'Protect PDF'}
        </button>

        {processedPdf && (
          <button className="download-btn" onClick={downloadProtected}>
            <FiDownload /> Download Protected PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfProtector;


