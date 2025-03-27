import { useState } from "react";
import ImageConverter from "./components/ImageConverter/ImageConverter"

function Navbar() {
  const [dropdown, setDropdown] = useState(null);

  return (
    <div>
      {/* Navbar */}
      <nav className="bg-white text-black p-4 flex justify-between items-center shadow-2xl fixed top-0 left-0 w-full z-10">
        <div className="text-xl font-bold">MegaToolbox</div>
        <ul className="flex gap-6 relative">
          {/* Image Tools Dropdown */}
          <li className="relative" onMouseEnter={() => setDropdown("image")} onMouseLeave={() => setDropdown(null)}>
            <button className="hover:text-yellow-400 px-3 py-2 border rounded-md">Image Tools</button>
            {dropdown === "image" && (
              <ul className="absolute left-0 bg-white p-2 shadow-lg w-48 border rounded-md">
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Image Conversion</li>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Compress Image</li>
              </ul>
            )}
          </li>
          
          {/* PDF Tools Dropdown */}
          <li className="relative" onMouseEnter={() => setDropdown("pdf")} onMouseLeave={() => setDropdown(null)}>
            <button className="hover:text-yellow-400 px-3 py-2 border rounded-md">PDF Tools</button>
            {dropdown === "pdf" && (
              <ul className="absolute left-0 bg-white p-2 shadow-lg w-48 border rounded-md">
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Convert PDF</li>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Merge PDF</li>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Split PDF</li>
              </ul>
            )}
          </li>
          
          {/* QR Tools Dropdown (Fix for Overflow Issue) */}
          <li className="relative" onMouseEnter={() => setDropdown("qr")} onMouseLeave={() => setDropdown(null)}>
            <button className="hover:text-yellow-400 px-3 py-2 border rounded-md">QR Tools</button>
            {dropdown === "qr" && (
              <ul className="absolute right-0 bg-white p-2 shadow-lg w-48 border rounded-md">
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Text to QR</li>
                <li className="p-2 hover:bg-gray-200 cursor-pointer">Image to QR</li>
              </ul>
            )}
          </li>
        </ul>
      </nav>

      {/* Sections */}
      <section id="image-tools" className="p-10 bg-gray-100 text-center mt-20">
        <h2 className="text-2xl font-bold">Image Tools</h2>
        
        {/* Image Conversion Section */}
        <div className="mt-6 p-6 bg-white shadow-md rounded-lg">
          <h3 className="text-xl font-semibold">Image Conversion</h3>
          <p className="text-gray-600">Convert images from one format to another seamlessly.</p>
          
          {/* Render ImageConverter Component */}
          <div className="mt-4">
            <ImageConverter />
          </div>
        </div>

        {/* Image Compression Section */}
        <div className="mt-6 p-6 bg-white shadow-md rounded-lg">
          <h3 className="text-xl font-semibold">Image Compression</h3>
          <p className="text-gray-600">Reduce image size while maintaining quality.</p>
        </div>
      </section>



      <section id="pdf-tools" className="p-10 bg-white text-center">
        <h2 className="text-2xl font-bold">PDF Tools</h2>
        <p>Merge, split, and convert PDFs with ease.</p>
      </section>

      <section id="qr-tools" className="p-10 bg-gray-100 text-center">
        <h2 className="text-2xl font-bold">QR Tools</h2>
        <p>Generate QR codes from text or images.</p>
      </section>
    </div>
  );
}

export default Navbar;
