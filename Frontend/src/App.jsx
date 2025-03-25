import { useState, useRef } from "react";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function App() {
  const [files, setFiles] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [format, setFormat] = useState("ToJPEG");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

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
    console.log("🚀 Convert button clicked!");
    if (files.length === 0) return alert("Please select at least one image");
    if (!format) return alert("Please select a format");

    setLoading(true);
    setConvertedFiles([]);

    try {
        console.log(`📡 Sending request to: http://localhost:4000/api/v1/image/${format}`);

        const formData = new FormData();
        files.forEach(file => {
            console.log(`📤 Attaching file: ${file.name}`);
            formData.append("images", file);
        });

        const response = await axios.post(
            `http://localhost:4000/api/v1/image/${format}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );

        console.log("✅ Server response:", response.data);

        if (!response.data.convertedFiles || response.data.convertedFiles.length === 0) {
            console.error("❌ No converted files returned from the server.");
            alert("Conversion failed. No files received.");
            return;
        }

        const convertedFiles = response.data.convertedFiles.map(file => {
            return {
                name: file.name,
                url: `data:${file.mimeType};base64,${file.buffer}`, // Convert Base64 to URL
                filePath: file.filePath
            };
        });

        console.log("✅ Conversion successful!", convertedFiles);
        setConvertedFiles(convertedFiles);

    } catch (error) {
        console.error("❌ Conversion failed", error);
        alert("Conversion failed! Please try again.");
    }

    setLoading(false);
};





  const handleDownloadAll = async () => {
    if (convertedFiles.length === 0) return;

    const zip = new JSZip();

    // Add each converted file to the ZIP archive
    for (let file of convertedFiles) {
      zip.file(file.name, file.blob);
    }

    // Generate the ZIP file and trigger the download
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "converted_images.zip");
  };

  const handleUploadClick = () => {
    inputRef.current.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <h1 className="text-2xl font-bold mb-4">Image Converter ({files.length})</h1>

      {/* Drag & Drop Area */}
      <div
        className="relative bg-white p-4 rounded-lg shadow-lg w-full max-w-5xl border-2 border-dashed text-center flex items-center gap-2 overflow-x-auto"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ minHeight: "140px" }}
      >
        {/* Images Container */}
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto whitespace-nowrap w-full px-8">
          {files.map((file, index) => (
            <div key={index} className="relative text-center">
              <img src={file.preview} alt={file.name} className="w-24 h-24 object-cover rounded-lg border" />
              <p className="text-xs mt-1 truncate w-24">{file.name}</p>
              <button className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full" onClick={() => removeImage(index)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Button Container */}
      <div className="flex gap-3 mt-3 w-full max-w-5xl">
        <button className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 w-full" onClick={handleUploadClick}>
          Upload Image
        </button>

        {/* Format Selection */}
        <select className="w-full py-2 px-4 border rounded" value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="ToJPEG">JPEG</option>
          <option value="ToPNG">PNG</option>
          <option value="ToJPG">JPG</option>
          <option value="ToWEBP">WEBP</option>
          <option value="ToGIF">GIF</option>
          <option value="ToTIFF">TIFF</option>
          <option value="ToPDF">PDF</option>
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

      {/* Download All Button */}
      <button
        className={`mt-4 py-2 px-4 rounded w-full max-w-5xl ${
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

export default App;
