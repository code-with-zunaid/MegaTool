import { useState, useRef } from "react";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";


const FORMAT_MAP = {
  ToJPEG: { ext: "jpeg", mime: "image/jpeg" },
  ToJPG: { ext: "jpg", mime: "image/jpeg" },
  ToPNG: { ext: "png", mime: "image/png" },
  ToWEBP: { ext: "webp", mime: "image/webp" },
  ToGIF: { ext: "gif", mime: "image/gif" },
  ToTIFF: { ext: "tiff", mime: "image/tiff" }
};

function ImageConverter() {
  const [files, setFiles] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [format, setFormat] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const base64ToBlob = (base64, mimeType) => {
    const byteChars = atob(base64.replace(/^data:[^;]+;base64,/, ''));
    const byteArrays = new Uint8Array(byteChars.length);
    
    for (let i = 0; i < byteChars.length; i++) {
      byteArrays[i] = byteChars.charCodeAt(i);
    }
    
    return new Blob([byteArrays], { type: mimeType });
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    previewImages(selectedFiles);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    previewImages(droppedFiles);
  };

  const previewImages = (selectedFiles) => {
    const imagePreviews = selectedFiles.map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setFiles((prevFiles) => [...prevFiles, ...imagePreviews]);
  };

  const removeImage = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setFiles([]);
    setConvertedFiles([]);
  };

  
  const handleConvert = async () => {
    if (files.length === 0) return alert("Please select images");
    setLoading(true);
    if(format==="")
    {
      console.log("please select an output formate");
      
    }
    try {
      const formData = new FormData();
      files.forEach(file => formData.append("images", file));

      const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_LOCAL_API;

      // Add debug logging
      console.log("Environment:", {
        API_BASE: import.meta.env.VITE_API_BASE_URL,
        LOCAL_API: import.meta.env.VITE_LOCAL_API,
        MODE: import.meta.env.MODE
      });
      const response = await axios.post(
        `${API_URL}/api/v1/image/${format}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const { ext, mime } = FORMAT_MAP[format] || { ext: "jpeg", mime: "image/jpeg" };
      
      const converted = response.data.convertedFiles.map(file => {
        // Clean filename and set proper extension
        const originalName = file.name.replace(/(_converted)?\.[^.]+$/, '');
        const newName = `${originalName}.${ext}`;
        
        const blob = base64ToBlob(file.buffer, mime);
        
        console.log("Blob details:", {
          name: newName,
          size: blob.size,
          type: blob.type,
          firstBytes: Array.from(new Uint8Array(blob.slice(0, 4)))
        });

        return {
          name: newName,
          blob: blob,
          url: URL.createObjectURL(blob)
        };
      });

      setConvertedFiles(converted);
    } catch (error) {
      console.error("Conversion error:", error);
      alert("Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!convertedFiles.length) return;

    try {
      const zip = new JSZip();
      
      convertedFiles.forEach(({ name, blob }) => {
        zip.file(name, blob, { binary: true });
      });

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `converted_images_${Date.now()}.zip`);
      
      console.log("ZIP contents:", {
        size: content.size,
        files: convertedFiles.map(f => f.name)
      });
      
    } catch (error) {
      console.error("ZIP error:", error);
      alert("Download failed");
    }
  };






  

  const handleUploadClick = () => {
    inputRef.current.click();
  };

  return (
    <div className=" flex flex-col items-center bg-gray-100 p-4 md:p-5  "> {/* Reduced padding */}
      <h1 className=" md:text-2xl md:mb-4">Selected Image = {files.length}</h1>

      {/* Drag & Drop Area */}
      <div
        className="relative bg-white p-3 md:p-4 rounded-lg shadow-lg w-full max-w-5xl border-2 border-dashed text-center flex items-center gap-2 overflow-x-auto"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ minHeight: "120px" }}
        
      >
        {/* Images Container */}
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto whitespace-nowrap w-full px-4 md:px-8"> {/* Reduced padding */}
          {files.map((file, index) => (
            <div key={index} className="relative text-center">
              <img src={file.preview} alt={file.name} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border" />
              <p className="text-xs mt-0.5 md:mt-1 truncate w-20 md:w-24">{file.name}</p>
              <button className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full" onClick={() => removeImage(index)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Button Container - Changed to column on mobile */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-2 md:mt-3 w-full max-w-5xl">
        <button className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 w-full" onClick={handleUploadClick}>
          Upload Image
        </button>

        {/* Format Selection */}
        <select className="w-full py-2 px-4 border rounded" value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="" disabled>Select an output format</option>
          <option value="ToJPEG">JPEG</option>
          <option value="ToPNG">PNG</option>
          <option value="ToJPG">JPG</option>
          <option value="ToWEBP">WEBP</option>
          <option value="ToGIF">GIF</option>
          <option value="ToTIFF">TIFF</option>
          
        </select>

        <button className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 w-full" onClick={handleConvert} disabled={loading}>
          {loading ? "Converting..." : "Convert"}
        </button>

        {files.length > 0 && (
          <button className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 w-full" onClick={clearImages}>
            Clear All
          </button>
        )}
      </div>

      {/* Download All Button - Reduced margin top */}
      <button
        className={`mt-2 md:mt-4 py-2 px-4 rounded w-full max-w-5xl ${
          convertedFiles.length > 0 ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
        }`}
        onClick={handleDownloadAll}
        disabled={convertedFiles.length === 0}
      >
        Download All
      </button>

      {/* Hidden File Input */}
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
    </div>
);
}

export default ImageConverter;
