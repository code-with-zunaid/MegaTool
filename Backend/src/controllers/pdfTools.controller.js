// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import path from "path";
// import fs from "fs";
// import PDFDocument from "pdfkit";
// import sharp from "sharp";
// import { PDFDocument as PDFLib } from 'pdf-lib';
// import crypto from 'crypto';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';
import fs from 'fs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current module path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read pdf-lib version from package.json
const pdfLibPath = join(__dirname, '../../node_modules/pdf-lib/package.json');
const { version } = JSON.parse(readFileSync(pdfLibPath, 'utf-8'));
console.log(`[PDF Protection] Initialized with pdf-lib v${version}`);

// Validate encryption capability
if (!PDFDocument.prototype.encrypt) {
    throw new Error('[FATAL] PDFDocument.encrypt method missing - reinstall pdf-lib');
}




// Image to PDF Converter function 
const convertImagesToPDF = asyncHandler(async (req, res) => {
  const debugTag = "[PDF Conversion]";
  let tempFiles = []; // Track files for cleanup

  try {
    console.log(`${debugTag} Initiated with ${req.files?.length || 0} files`);

    // Validate request
    if (!req.files?.length) {
      console.error(`${debugTag} No files in request`);
      throw new ApiError(400, "Minimum 1 image required");
    }

    // File validation and temp file tracking
    const validFiles = req.files.filter(file => {
      const isValid = ['image/jpeg', 'image/png'].includes(file.mimetype);
      if (isValid) tempFiles.push(file.path);
      return isValid;
    });

    if (validFiles.length !== req.files.length) {
      console.error(`${debugTag} Invalid file types detected`);
      throw new ApiError(400, "Only JPG/PNG images supported");
    }

    // PDF generation setup
    const doc = new PDFDocument({ autoFirstPage: false });
    const buffers = [];
    let totalOriginalSize = 0;
    const conversionMetrics = [];

    // Setup PDF event handlers first
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('end', () => {
        console.log(`${debugTag} PDF generation completed`);
        resolve(Buffer.concat(buffers));
      });
      
      doc.on('error', (error) => {
        console.error(`${debugTag} PDF generation failed:`, error);
        reject(new ApiError(500, "PDF creation failed"));
      });
    });

    doc.on('data', (chunk) => {
      buffers.push(chunk);
      console.log(`${debugTag} PDF chunk processed: ${chunk.length} bytes`);
    });

    // Process images
    for (const [index, file] of validFiles.entries()) {
      const fileTag = `File ${index + 1}/${validFiles.length} [${file.originalname}]`;
      try {
        console.log(`${debugTag} ${fileTag} Processing`);

        // Async file check
        await fs.promises.access(file.path, fs.constants.F_OK);
        const stats = await fs.promises.stat(file.path);
        
        const processor = sharp(file.path);
        const metadata = await processor.metadata();
        
        console.log(`${debugTag} ${fileTag} Dimensions: ${metadata.width}x${metadata.height}`);
        
        // Add to PDF
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
    const pdfBuffer = await pdfPromise;

    // Response data
    const resultData = {
      pdf: pdfBuffer.toString('base64'),
      fileName: `converted-${Date.now()}.pdf`,
      metrics: {
        fileCount: validFiles.length,
        totalOriginalSize,
        pdfSize: pdfBuffer.length,
        compressionRatio: (pdfBuffer.length / totalOriginalSize).toFixed(2)
      }
    };

    console.log(`${debugTag} Conversion successful: ${resultData.metrics.fileCount} files`);
    
    // Cleanup temp files
    await Promise.all(tempFiles.map(async (path) => {
      try {
        await fs.promises.unlink(path);
        console.log(`${debugTag} Cleaned up: ${path}`);
      } catch (cleanupError) {
        console.warn(`${debugTag} Cleanup failed for ${path}:`, cleanupError);
      }
    }));

    return res.status(200).json(new ApiResponse(200, resultData, "Conversion successful"));

  } catch (error) {
    // Error cleanup
    await Promise.all(tempFiles.map(async (path) => {
      try {
        await fs.promises.unlink(path);
        console.warn(`${debugTag} Error cleanup removed: ${path}`);
      } catch (cleanupError) {
        console.error(`${debugTag} Critical cleanup failure:`, cleanupError);
      }
    }));

    console.error(`${debugTag} Fatal error:`, error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Conversion pipeline failed";
    throw new ApiError(statusCode, message);
  }
});

// PDF Splitter Controller


const splitPdf = asyncHandler(async (req, res) => {
  try {
    console.log("[splitPdf] Headers:", req.headers);
    console.log("[splitPdf] Received file:", req.file?.originalname);
    console.log("[splitPdf] Body:", req.body);

    // Validate request
    if (!req.file) {
      console.error("[splitPdf] No file uploaded");
      throw new ApiError(400, "Please upload a PDF file");
    }

    // Verify temporary file exists
    if (!req.file.path || !fs.existsSync(req.file.path)) {
      console.error("[splitPdf] Temporary file missing");
      throw new ApiError(400, "File upload failed");
    }

    // Read PDF file from disk storage
    const pdfBuffer = fs.readFileSync(req.file.path);
    const originalPdf = await PDFLib.load(pdfBuffer);
    const totalPages = originalPdf.getPageCount();
    console.log(`[splitPdf] Total pages: ${totalPages}`);

    // Cleanup temp file immediately after loading
    try {
      fs.unlinkSync(req.file.path);
      console.log("[splitPdf] Temporary file cleaned up");
    } catch (cleanupError) {
      console.error("[splitPdf] Temp file cleanup failed:", cleanupError);
    }

    // Validate ranges parameter
    const { ranges } = req.body;
    if (!ranges || typeof ranges !== 'string') {
      console.error("[splitPdf] Invalid ranges:", ranges);
      throw new ApiError(400, "Please provide valid page ranges");
    }

    // Process and validate ranges
    const parsedRanges = ranges.split(',').map(range => {
      const trimmed = range.trim();
      if (!trimmed.match(/^\d+(-\d+)?$/)) {
        throw new ApiError(400, `Invalid range format: ${trimmed}`);
      }
      return trimmed;
    });

    console.log("[splitPdf] Validated ranges:", parsedRanges);

    const results = [];
    
    // Process each range
    for (const range of parsedRanges) {
      try {
        let [startStr, endStr] = range.split('-');
        const start = parseInt(startStr);
        const end = endStr ? parseInt(endStr) : start;

        // Validate page numbers
        if (isNaN(start) || isNaN(end) || 
            start < 1 || end < start || 
            end > totalPages) {
          console.error(`[splitPdf] Invalid range ${range} for ${totalPages}-page PDF`);
          throw new ApiError(400, `Invalid range: ${range}. Document has ${totalPages} pages.`);
        }

        console.log(`[splitPdf] Processing range ${start}-${end}`);
        
        // Extract pages
        const pageIndices = Array.from(
          { length: end - start + 1 },
          (_, i) => start - 1 + i
        );
        
        // Create new PDF
        const newPdf = await PDFLib.create();
        const pages = await newPdf.copyPages(originalPdf, pageIndices);
        pages.forEach(page => newPdf.addPage(page));
        
        // Convert to base64
        const pdfBytes = await newPdf.save();
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

        results.push({
          data: pdfBase64,
          fileName: `split_part_${start}-${end}.pdf`,
          pages: `${start}-${end}`
        });

      } catch (rangeError) {
        console.error(`[splitPdf] Range ${range} failed:`, rangeError);
        throw new ApiError(400, `Error processing ${range}: ${rangeError.message}`);
      }
    }

    console.log(`[splitPdf] Created ${results.length} split files`);
    return res.status(200).json(
      new ApiResponse(200, { splitFiles: results }, "PDF split successfully")
    );
    

  } catch (error) {
    // Error cleanup
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("[splitPdf] Error cleanup - removed temp file");
      } catch (cleanupError) {
        console.error("[splitPdf] Error cleanup failed:", cleanupError);
      }
    }

    console.error("[splitPdf] Split failed:", error.stack);
    const statusCode = error.statusCode || 500;
    const message = error.message || "PDF split operation failed";
    return res.status(statusCode).json(new ApiError(statusCode, message));
  }
});

// PDF Merger Controller
const mergePdfs = asyncHandler(async (req, res) => {
  const tempFiles = [];
  
  try {
    console.log("[mergePdfs] Headers:", req.headers);
    console.log("[mergePdfs] Received files:", req.files?.map(f => f.originalname));

    if (!req.files?.length) {
      console.error("[mergePdfs] No files uploaded");
      throw new ApiError(400, "Please upload at least two PDF files");
    }

    // Validate file types and store paths for cleanup
    const validFiles = req.files.filter(file => {
      const isValid = file.mimetype === 'application/pdf';
      if (isValid) tempFiles.push(file.path);
      return isValid;
    });

    if (validFiles.length !== req.files.length) {
      console.error("[mergePdfs] Invalid file types detected");
      throw new ApiError(400, "Only PDF files are allowed");
    }

    console.log(`[mergePdfs] Merging ${validFiles.length} valid PDFs`);

    const mergedPdf = await PDFLib.create();
    let totalPages = 0;

    for (const [index, file] of validFiles.entries()) {
      try {
        console.log(`[mergePdfs] Processing PDF ${index + 1}: ${file.originalname}`);
        
        // Read file from disk
        const pdfBuffer = fs.readFileSync(file.path);
        const pdf = await PDFLib.load(pdfBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        pages.forEach(page => mergedPdf.addPage(page));
        totalPages += pages.length;

        console.log(`[mergePdfs] Added ${pages.length} pages from ${file.originalname}`);

      } catch (mergeError) {
        console.error(`[mergePdfs] Error processing ${file.originalname}:`, mergeError);
        throw new ApiError(500, `Failed to process ${file.originalname}: ${mergeError.message}`);
      }
    }

    // Finalize PDF
    const pdfBytes = await mergedPdf.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    console.log(`[mergePdfs] Successfully merged ${validFiles.length} PDFs into ${totalPages} pages`);

    // Cleanup temp files
    await Promise.all(tempFiles.map(async (path) => {
      try {
        await fs.promises.unlink(path);
        console.log(`[mergePdfs] Cleaned temp file: ${path}`);
      } catch (cleanupError) {
        console.error(`[mergePdfs] Failed to clean ${path}:`, cleanupError);
      }
    }));

    return res.status(200).json(
      new ApiResponse(200, {
        mergedPdf: pdfBase64,
        fileName: `merged_${Date.now()}.pdf`
      }, "PDFs merged successfully")
    );

  } catch (error) {
    // Error cleanup
    await Promise.all(tempFiles.map(async (path) => {
      try {
        await fs.promises.unlink(path);
        console.log(`[mergePdfs] Error cleanup removed: ${path}`);
      } catch (cleanupError) {
        console.error(`[mergePdfs] Critical cleanup failure:`, cleanupError);
      }
    }));

    console.error("[mergePdfs] Merge failed:", error.stack);
    const statusCode = error.statusCode || 500;
    const message = error.message || "PDF merge operation failed";
    return res.status(statusCode).json(new ApiError(statusCode, message));
  }
});


//Remove pages from pdf
const removePagesFromPdf = asyncHandler(async (req, res) => {
  const debugTag = '[Backend/PDF]';
  let pdfBuffer;

  try {
    console.log(`${debugTag} Remove pages request received`);
    console.log(`${debugTag} Headers:`, req.headers);
    console.log(`${debugTag} Body keys:`, Object.keys(req.body));

    // Validate input
    if (!req.file) {
      console.error(`${debugTag} No file uploaded`);
      throw new ApiError(400, 'PDF file is required');
    }

    if (!req.body.pages) {
      console.error(`${debugTag} Missing pages parameter`);
      throw new ApiError(400, 'Pages to remove are required');
    }

    // Parse pages
    const pagesToRemove = req.body.pages
      .split(',')
      .map(p => parseInt(p.trim()))
      .filter(p => !isNaN(p));

    console.log(`${debugTag} Parsed pages:`, pagesToRemove);

    if (pagesToRemove.length === 0) {
      console.error(`${debugTag} Invalid pages format:`, req.body.pages);
      throw new ApiError(400, 'Invalid pages format. Use comma-separated numbers');
    }

    // Load PDF
    console.log(`${debugTag} Loading PDF (size: ${req.file.size} bytes)`);
    pdfBuffer = fs.readFileSync(req.file.path);
    const originalPdf = await PDFLib.load(pdfBuffer); // Changed to PDFLib
    const totalPages = originalPdf.getPageCount();
    console.log(`${debugTag} PDF loaded with ${totalPages} pages`);

    // Validate page numbers
    const invalidPages = pagesToRemove.filter(p => p < 1 || p > totalPages);
    if (invalidPages.length > 0) {
      console.error(`${debugTag} Invalid pages requested:`, invalidPages);
      throw new ApiError(400, `Invalid pages: ${invalidPages.join(', ')}. Document has ${totalPages} pages.`);
    }

    // Convert to 0-based indices
    const pageIndices = pagesToRemove.map(p => p - 1);
    console.log(`${debugTag} Removing pages (0-based indices):`, pageIndices); // Fixed extra parenthesis

    // Create new PDF
    const newPdf = await PDFLib.create(); // Changed to PDFLib
    const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i)
      .filter(i => !pageIndices.includes(i));

    console.log(`${debugTag} Pages to keep:`, pagesToKeep.map(p => p + 1));

    // Copy pages
    const pages = await newPdf.copyPages(originalPdf, pagesToKeep);
    pages.forEach(page => newPdf.addPage(page));
    console.log(`${debugTag} Pages copied successfully`);

    // Save PDF
    const processedBytes = await newPdf.save();
    console.log(`${debugTag} New PDF size: ${processedBytes.length} bytes`);

    // Prepare response
    const base64Pdf = Buffer.from(processedBytes).toString('base64');
    const fileName = `modified_${Date.now()}.pdf`;

    console.log(`${debugTag} Sending response with ${base64Pdf.length} chars base64 data`);
    
    res.status(200).json(
      new ApiResponse(200, {
        processedPdf: base64Pdf,
        fileName: fileName
      }, 'Pages removed successfully')
    );

  } catch (error) {
    console.error(`${debugTag} Error processing PDF:`, {
      message: error.message,
      stack: error.stack,
      ...(error instanceof ApiError && { statusCode: error.statusCode })
    });

    // Cleanup if using file storage
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log(`${debugTag} Cleaned temp file: ${req.file.path}`);
      } catch (cleanupError) {
        console.error(`${debugTag} Temp file cleanup failed:`, cleanupError);
      }
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'PDF processing failed';
    res.status(statusCode).json(new ApiError(statusCode, message));
  }
});

// Extract pages from pdf
const extractPagesFromPdf = asyncHandler(async (req, res) => {
  const debugTag = '[Extractor/Backend]';
  let filePath = null;

  try {
    console.log(`${debugTag} Extraction request received`);
    
    if (!req.file) {
      console.error(`${debugTag} No file uploaded`);
      throw new ApiError(400, 'PDF file is required');
    }

    // Store file path for cleanup
    filePath = req.file.path;
    console.log(`${debugTag} Processing file: ${filePath}`);

    // Validate pages parameter
    const pages = req.body.pages
      .split(',')
      .map(p => parseInt(p.trim()))
      .filter(p => !isNaN(p))
      .sort((a, b) => a - b);

    console.log(`${debugTag} Pages requested:`, pages);

    if (pages.length === 0) {
      console.error(`${debugTag} Invalid pages parameter`);
      throw new ApiError(400, 'No valid pages specified');
    }

    // Read PDF file
    console.log(`${debugTag} Reading PDF from disk`);
    const pdfBuffer = fs.readFileSync(filePath);
    
    // Load PDF
    const originalPdf = await PDFLib.load(pdfBuffer);
    const totalPages = originalPdf.getPageCount();
    console.log(`${debugTag} PDF contains ${totalPages} pages`);

    // Validate page numbers
    const invalidPages = pages.filter(p => p < 1 || p > totalPages);
    if (invalidPages.length > 0) {
      console.error(`${debugTag} Invalid pages:`, invalidPages);
      throw new ApiError(400, `Invalid pages: ${invalidPages.join(', ')}`);
    }

    // Process PDF
    console.log(`${debugTag} Creating new PDF document`);
    const newPdf = await PDFLib.create();
    const pageIndices = pages.map(p => p - 1);
    
    console.log(`${debugTag} Copying pages:`, pageIndices);
    const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    // Finalize PDF
    console.log(`${debugTag} Saving processed PDF`);
    const processedBytes = await newPdf.save();
    
    // Cleanup temp file
    console.log(`${debugTag} Cleaning up temporary file`);
    fs.unlinkSync(filePath);

    // Send response
    console.log(`${debugTag} Sending response`);
    res.status(200).json(
      new ApiResponse(200, {
        processedPdf: Buffer.from(processedBytes).toString('base64'),
        fileName: `extracted-pages-${Date.now()}.pdf`
      }, 'Pages extracted successfully')
    );

  } catch (error) {
    // Cleanup temp file on error
    if (filePath && fs.existsSync(filePath)) {
      console.log(`${debugTag} Error cleanup - removing temp file`);
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error(`${debugTag} Temp file cleanup failed:`, cleanupError);
      }
    }

    console.error(`${debugTag} Extraction failed:`, {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500
    });

    const statusCode = error.statusCode || 500;
    const message = error.message.includes('pdfBuffer')
      ? 'PDF processing error - invalid file format'
      : error.message || 'PDF extraction failed';
      
    res.status(statusCode).json(new ApiError(statusCode, message));
  }
});

// Protect pdf





const protectPdf = asyncHandler(async (req, res) => {


    const debugTag = '[PDF Protection]';
    let tempFilePath = null;
    let originalSize = 0;
    let protectedSize = 0;

    try {
        console.log(`${debugTag} Starting protection process`);
          // 1. Version Validation
        if (!PDFDocument.prototype.encrypt) {
          console.error(`${debugTag} Fatal: pdf-lib version too old`);
          throw new ApiError(500, 'Server requires pdf-lib v1.17.0+');
      }
        // 1. Request Validation
        console.debug(`${debugTag} Phase: Request Validation`);
        if (!req.file?.path) {
            console.error(`${debugTag} No file uploaded`);
            throw new ApiError(400, "PDF file is required");
        }

        if (!req.body.password || req.body.password.length < 8) {
            console.error(`${debugTag} Invalid password length: ${req.body.password?.length || 0}`);
            throw new ApiError(400, "Password must be at least 8 characters");
        }

        // 2. File Handling
        console.debug(`${debugTag} Phase: File Handling`);
        tempFilePath = req.file.path;
        const password = req.body.password;
        
        console.debug(`${debugTag} Temporary file: ${tempFilePath}`);
        const stats = await fs.promises.stat(tempFilePath);
        originalSize = stats.size;
        console.debug(`${debugTag} Original size: ${formatBytes(originalSize)}`);

        // 3. Read and Validate PDF
        console.debug(`${debugTag} Phase: PDF Validation`);
        const pdfBuffer = await fs.promises.readFile(tempFilePath);
        
        if (!isValidPdf(pdfBuffer)) {
            console.error(`${debugTag} Invalid PDF header`);
            throw new ApiError(400, "Invalid PDF file format");
        }

        // 4. PDF Processing
        console.time(`${debugTag} PDF Processing Time`);
        console.debug(`${debugTag} Phase: PDF Processing`);
        
        console.log(`${debugTag} Loading PDF document`);
        const pdfDoc = await PDFLib.load(pdfBuffer);
        console.debug(`${debugTag} Page count: ${pdfDoc.getPages().length}`);

        // 5. Encryption Setup
        console.debug(`${debugTag} Phase: Encryption`);
        const ownerPassword = crypto.randomBytes(16).toString('hex');
        
        console.debug(`${debugTag} Generated owner password: ${ownerPassword.substring(0, 6)}...`);
        console.debug(`${debugTag} Configuring encryption...`);

        // Modern pdf-lib encryption syntax
        await pdfDoc.encrypt({
            userPassword: password,
            ownerPassword: ownerPassword,
            permissions: {
                allowPrinting: true,
                allowModifications: false,
                allowCopying: false,
                allowAnnotations: false,
                allowFillingForms: false,
                allowContentAccessibility: false,
                allowDocumentAssembly: false
            },
            encryption: {
                algorithm: 'AES_256',
                keyLength: 256
            }
        });

        // 6. Save Protected PDF
        console.debug(`${debugTag} Saving protected PDF...`);
        const protectedPdfBytes = await pdfDoc.save();
        protectedSize = protectedPdfBytes.length;
        console.debug(`${debugTag} Protected size: ${formatBytes(protectedSize)}`);
        console.timeEnd(`${debugTag} PDF Processing Time`);

        // 7. Generate Report
        console.debug(`${debugTag} Generating security report...`);
        const reportBuffer = await generateSecurityReport({
            originalSize,
            protectedSize,
            algorithm: 'AES-256'
        });

        // 8. Cleanup
        console.debug(`${debugTag} Cleaning temporary files...`);
        await fs.promises.unlink(tempFilePath);

        // 9. Response
        console.debug(`${debugTag} Sending response...`);
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    protectedPdf: protectedPdfBytes.toString('base64'),
                    securityReport: reportBuffer.toString('base64'),
                    metadata: {
                        originalSize: formatBytes(originalSize),
                        protectedSize: formatBytes(protectedSize),
                        sizeChange: calculateSizeChange(originalSize, protectedSize),
                        encryption: 'AES-256'
                    }
                },
                "PDF protected successfully"
            )
        );

    } catch (error) {
        console.error(`${debugTag} ERROR:`, {
            message: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // Cleanup temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            console.warn(`${debugTag} Emergency cleanup...`);
            await fs.promises.unlink(tempFilePath).catch((err) => {
                console.error(`${debugTag} Cleanup failed:`, err);
            });
        }

        const statusCode = error.statusCode || 500;
        const message = error instanceof ApiError ? error.message : 'PDF protection failed';
        throw new ApiError(statusCode, message);
    }
});

// Helper Functions
const isValidPdf = (buffer) => {
    try {
        return buffer?.length > 4 &&
            buffer[0] === 0x25 && // %
            buffer[1] === 0x50 && // P
            buffer[2] === 0x44 && // D
            buffer[3] === 0x46;   // F
    } catch (error) {
        console.error('[Validation] PDF validation error:', error);
        return false;
    }
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const calculateSizeChange = (original, current) => {
    if (original <= 0 || current <= 0) return 'N/A';
    const change = ((current - original) / original * 100).toFixed(2);
    return `${change}%`;
};

const generateSecurityReport = async (metadata) => {
    try {
        const doc = new PDFDocument();
        doc.fontSize(12).text('Security Report', { align: 'center' });
        doc.moveDown().text(`Generated: ${new Date().toISOString()}`);
        doc.text(`Original Size: ${metadata.originalSize}`);
        doc.text(`Protected Size: ${metadata.protectedSize}`);
        doc.text(`Size Change: ${metadata.sizeChange}`);
        doc.text(`Encryption: ${metadata.algorithm}`);
        
        return new Promise((resolve) => {
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.end();
        });
    } catch (error) {
        console.error('[Report] Generation failed:', error);
        return Buffer.from('Error generating report');
    }
};




export {
  convertImagesToPDF,
  splitPdf,
  mergePdfs,
  removePagesFromPdf,
  extractPagesFromPdf,
  protectPdf
};