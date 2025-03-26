import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { PDFDocument as PDFLib } from 'pdf-lib';

// Image to PDF Converter
const convertImagesToPDF = asyncHandler(async (req, res) => {
  try {
    console.log("[convertImagesToPDF] Starting conversion process");
    
    if (!req.files?.length) {
      console.error("[convertImagesToPDF] No files uploaded");
      throw new ApiError(400, "Please upload at least one image");
    }

    const doc = new PDFDocument();
    const buffers = [];
    
    // Set up PDF document handlers
    doc.on('data', (chunk) => {
      console.log("[convertImagesToPDF] Received PDF chunk of size:", chunk.length);
      buffers.push(chunk);
    });
    
    doc.on('end', () => {
      console.log("[convertImagesToPDF] PDF generation completed");
    });

    // Process each image
    for (const [index, file] of req.files.entries()) {
      try {
        console.log(`[convertImagesToPDF] Processing image ${index + 1}/${req.files.length}: ${file.originalname}`);
        
        // Validate image file
        if (!fs.existsSync(file.path)) {
          console.error(`[convertImagesToPDF] File not found: ${file.path}`);
          throw new ApiError(400, `Image ${file.originalname} not found`);
        }

        // Get image metadata
        const metadata = await sharp(file.path).metadata();
        console.log(`[convertImagesToPDF] Image dimensions: ${metadata.width}x${metadata.height}`);

        // Add PDF page
        doc.addPage({ size: [metadata.width, metadata.height] });
        
        // Add image to PDF
        doc.image(fs.readFileSync(file.path), 0, 0, { 
          width: metadata.width,
          height: metadata.height
        });

      } catch (imageError) {
        console.error(`[convertImagesToPDF] Error processing image ${file.originalname}:`, imageError);
        throw new ApiError(500, `Failed to process image ${file.originalname}: ${imageError.message}`);
      }
    }

    doc.end();
    
    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    // Cleanup files
    console.log("[convertImagesToPDF] Cleaning up temporary files");
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    // Send response
    return res.status(200).json(
      new ApiResponse(200, {
        pdf: pdfBuffer.toString('base64'),
        fileName: `converted-${Date.now()}.pdf`
      }, "PDF conversion successful")
    );

  } catch (error) {
    // Cleanup on error
    req.files?.forEach(file => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
    
    console.error("[convertImagesToPDF] Conversion failed:", error);
    throw new ApiError(error.statusCode || 500, error.message || "PDF conversion failed");
  }
});

// PDF Splitter Controller
const splitPdf = asyncHandler(async (req, res) => {
  try {
    console.log("[splitPdf] Starting PDF split operation");
    
    if (!req.file) {
      console.error("[splitPdf] No PDF file uploaded");
      throw new ApiError(400, "Please upload a PDF file");
    }

    const { ranges } = req.body;
    if (!ranges || typeof ranges !== 'string') {
      console.error("[splitPdf] Invalid ranges parameter:", ranges);
      throw new ApiError(400, "Please provide valid page ranges");
    }

    const parsedRanges = ranges.split(',').map(range => range.trim());
    console.log("[splitPdf] Parsed ranges:", parsedRanges);

    const results = [];
    const originalPdf = await PDFLib.load(req.file.buffer);
    const totalPages = originalPdf.getPageCount();
    console.log(`[splitPdf] Original PDF has ${totalPages} pages`);

    for (const range of parsedRanges) {
      try {
        const [startStr, endStr] = range.split('-');
        const start = parseInt(startStr);
        const end = parseInt(endStr) || start;

        if (isNaN(start) || start < 1 || start > totalPages ||
            isNaN(end) || end < start || end > totalPages) {
          console.error(`[splitPdf] Invalid range: ${range}`);
          throw new ApiError(400, `Invalid page range: ${range}`);
        }

        console.log(`[splitPdf] Processing range ${start}-${end}`);
        
        const newPdf = await PDFLib.create();
        const pages = await newPdf.copyPages(originalPdf, 
          Array.from({length: end - start + 1}, (_, i) => start - 1 + i)
        );
        
        pages.forEach(page => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();

        results.push({
          data: Buffer.from(pdfBytes).toString('base64'),
          fileName: `split_part_${start}-${end}.pdf`,
          pages: `${start}-${end}`
        });

      } catch (rangeError) {
        console.error(`[splitPdf] Error processing range ${range}:`, rangeError);
        throw new ApiError(400, `Error processing range ${range}: ${rangeError.message}`);
      }
    }

    return res.status(200).json(
      new ApiResponse(200, { splitFiles: results }, "PDF split successfully")
    );

  } catch (error) {
    console.error("[splitPdf] PDF split failed:", error);
    throw new ApiError(error.statusCode || 500, error.message || "PDF split operation failed");
  }
});

// PDF Merger Controller
const mergePdfs = asyncHandler(async (req, res) => {
  try {
    console.log("[mergePdfs] Starting PDF merge operation");
    
    if (!req.files?.length) {
      console.error("[mergePdfs] No PDF files uploaded");
      throw new ApiError(400, "Please upload at least two PDF files");
    }

    const mergedPdf = await PDFLib.create();
    console.log(`[mergePdfs] Merging ${req.files.length} PDFs`);

    for (const [index, file] of req.files.entries()) {
      try {
        console.log(`[mergePdfs] Processing PDF ${index + 1}: ${file.originalname}`);
        
        const pdf = await PDFLib.load(file.buffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));

      } catch (mergeError) {
        console.error(`[mergePdfs] Error processing PDF ${file.originalname}:`, mergeError);
        throw new ApiError(500, `Failed to process PDF ${file.originalname}: ${mergeError.message}`);
      }
    }

    const pdfBytes = await mergedPdf.save();
    
    return res.status(200).json(
      new ApiResponse(200, {
        mergedPdf: Buffer.from(pdfBytes).toString('base64'),
        fileName: `merged_${Date.now()}.pdf`
      }, "PDFs merged successfully")
    );

  } catch (error) {
    console.error("[mergePdfs] PDF merge failed:", error);
    throw new ApiError(error.statusCode || 500, error.message || "PDF merge operation failed");
  }
});

export {
  convertImagesToPDF,
  splitPdf,
  mergePdfs
};