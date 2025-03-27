import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { PDFDocument as PDFLib } from 'pdf-lib';

// Image to PDF Converter function 
const convertImagesToPDF = asyncHandler(async (req, res) => {
  const debugTag = "[PDF Conversion]";
  try {
    console.log(`${debugTag} Initiated with ${req.files?.length || 0} files`);

    // Validate request
    if (!req.files?.length) {
      console.error(`${debugTag} No files in request`);
      throw new ApiError(400, "Minimum 1 image required");
    }

    // File validation middleware
    const validFiles = req.files.filter(file => 
      ['image/jpeg', 'image/png'].includes(file.mimetype)
    );
    
    if (validFiles.length !== req.files.length) {
      console.error(`${debugTag} Invalid file types detected`);
      throw new ApiError(400, "Only JPG/PNG images supported");
    }

    // Conversion tracking
    let totalOriginalSize = 0;
    let conversionMetrics = [];
    
    const doc = new PDFDocument({autoFirstPage: false});
    const buffers = [];
    
    doc.on('data', (chunk) => {
      buffers.push(chunk);
      console.log(`${debugTag} PDF chunk processed: ${chunk.length} bytes`);
    });

    // Process images with error tracking
    for (const [index, file] of validFiles.entries()) {
      const fileTag = `File ${index + 1}/${validFiles.length} [${file.originalname}]`;
      try {
        console.log(`${debugTag} ${fileTag} Processing`);
        
        // File system checks
        if (!fs.existsSync(file.path)) {
          console.error(`${debugTag} ${fileTag} Missing from temp storage`);
          throw new ApiError(400, `File ${file.originalname} upload failed`);
        }

        // Image processing
        const stats = fs.statSync(file.path);
        const processor = sharp(file.path);
        const metadata = await processor.metadata();
        
        console.log(`${debugTag} ${fileTag} Dimensions: ${metadata.width}x${metadata.height}`);
        
        // PDF page creation
        doc.addPage({ size: [metadata.width, metadata.height] });
        doc.image(await processor.toBuffer(), 0, 0, {
          width: metadata.width,
          height: metadata.height
        });

        // Track metrics
        totalOriginalSize += stats.size;
        conversionMetrics.push({
          name: file.originalname,
          originalSize: stats.size,
          dimensions: `${metadata.width}x${metadata.height}`
        });

      } catch (fileError) {
        console.error(`${debugTag} ${fileTag} Failed:`, fileError);
        throw new ApiError(500, `Processing failed for ${file.originalname}`);
      }
    }

    // Finalize PDF
    doc.end();
    const pdfBuffer = await new Promise(resolve => doc.on('end', () => {
      console.log(`${debugTag} PDF generation completed`);
      resolve(Buffer.concat(buffers));
    }));

    // Cleanup with verification
    req.files.forEach(file => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`${debugTag} Cleaned up: ${file.path}`);
        }
      } catch (cleanupError) {
        console.warn(`${debugTag} Cleanup failed for ${file.path}:`, cleanupError);
      }
    });

    // Response with analytics
    return res.status(200).json(new ApiResponse(200, {
      pdf: pdfBuffer.toString('base64'),
      fileName: `converted-${Date.now()}.pdf`,
      metrics: {
        fileCount: validFiles.length,
        totalOriginalSize,
        pdfSize: pdfBuffer.length,
        compressionRatio: (pdfBuffer.length / totalOriginalSize).toFixed(2)
      }
    }, "Conversion successful"));

  } catch (error) {
    // Comprehensive error cleanup
    req.files?.forEach(file => {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.warn(`${debugTag} Error cleanup removed: ${file.path}`);
        } catch (cleanupError) {
          console.error(`${debugTag} Critical cleanup failure:`, cleanupError);
        }
      }
    });
    
    console.error(`${debugTag} Fatal error:`, error);
    throw new ApiError(error.statusCode || 500, error.message || "Conversion pipeline failed");
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