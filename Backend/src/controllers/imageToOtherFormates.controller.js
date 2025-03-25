import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { Jimp } from "jimp";
import svg2img from "svg2img";



/* const convertImageToPDF = asyncHandler(async (req, res) => {
    const imageLocalPath = req.file?.path;

    if (!imageLocalPath) {
        throw new ApiError(400, "Image file is missing");
    }

    // Generate a unique filename for the converted PDF
    const outputFileName = `${Date.now()}_converted.pdf`;
    const outputFilePath = path.join("public", "ConvertedFiles", outputFileName);

    // Create a PDF document and add the image
    const doc = new PDFDocument({ autoFirstPage: false });
    const writeStream = fs.createWriteStream(outputFilePath);

    doc.pipe(writeStream);
    // Get image dimensions
    const { width, height } = doc.openImage(imageLocalPath);

    // Set PDF page size to match the image size
    doc.addPage({ size: [width, height] });

    // Add image at original size
    doc.image(imageLocalPath, 0, 0, { width: width, height: height });

    doc.end();

    writeStream.on("finish", () => {
        return res.status(200).json(
            new ApiResponse(200, { filePath: `/ConvertedFiles/${outputFileName}` }, "Image converted to PDF successfully")
        );
    });

    writeStream.on("error", (err) => {
        throw new ApiError(500, "Error generating PDF");
    });
}); */
const convertImagesToPDF = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
    }

    const outputFileName = `${Date.now()}_converted.pdf`;
    const outputFilePath = path.join("public", "ConvertedFiles", outputFileName);

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputFilePath);
    doc.pipe(writeStream);

    for (const file of req.files) {
        const { width, height } = doc.openImage(file.path);
        doc.addPage({ size: [width, height] });
        doc.image(file.path, 0, 0, { width, height });
    }

    doc.end();

    writeStream.on("finish", () => {
        return res.status(200).json({
            filePath: `/ConvertedFiles/${outputFileName}`,
            message: "Images converted to PDF successfully",
        });
    });

    writeStream.on("error", (err) => {
        res.status(500).json({ error: "Error generating PDF" });
    });
});





const convertImages = async (req, res, format) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    try {
        const convertedFiles = await Promise.all(req.files.map(async (file) => {
            const inputFilePath = file.path;

            // Debug uploaded file before conversion
            const fileSize = fs.statSync(inputFilePath).size;
            console.log(`✅ Uploaded file: ${inputFilePath} | Size: ${fileSize} bytes`);
            if (fileSize === 0) {
                console.error(`❌ File is empty: ${inputFilePath}`);
                return res.status(500).json({ error: "Uploaded file is empty" });
            }

            const baseName = path.basename(file.filename, path.extname(file.filename));
            const outputFileName = `${baseName}.${format}`;
            const outputPath = path.join("public/ConvertedFiles", outputFileName);

            console.log(`🔄 Converting: ${inputFilePath} → ${outputPath}`);

            // Convert image using Sharp
            await sharp(inputFilePath).toFormat(format).toFile(outputPath);

            // Debug converted file
            const convertedFileSize = fs.statSync(outputPath).size;
            console.log(`✅ Converted file: ${outputPath} | Size: ${convertedFileSize} bytes`);

            if (convertedFileSize === 0) {
                console.error(`❌ Conversion failed: ${outputPath} is empty`);
                return res.status(500).json({ error: "Conversion failed" });
            }

            // Read the converted file as a buffer
            const fileBuffer = fs.readFileSync(outputPath);

            return {
                name: outputFileName,
                filePath: `/ConvertedFiles/${outputFileName}`,
                buffer: fileBuffer.toString("base64"), // Encode file as Base64
                mimeType: `image/${format}`
            };
        }));

        return res.status(200).json({ convertedFiles });

    } catch (error) {
        console.error("❌ Conversion error:", error);
        return res.status(500).json({ error: "Error processing the images" });
    }
};








async function convertImageTo_BMP(req, res) {
    try {
        const inputPath = req.file.path;
        const outputPath = inputPath.replace(/\.[^.]+$/, ".bmp");

        const image = await Jimp.read(inputPath);
        await image.writeAsync(outputPath);

        res.sendFile(outputPath, { root: "." });
    } catch (error) {
        res.status(500).json({ error: "Conversion failed", details: error.message });
    }
}

async function convertImageTo_SVG(req, res) {
    try {
        const inputPath = req.file.path;
        const outputPath = inputPath.replace(/\.[^.]+$/, ".svg");

        svg2img(inputPath, function (error, buffer) {
            if (error) {
                return res.status(500).json({ error: "Conversion failed", details: error.message });
            }
            res.set("Content-Type", "image/svg+xml");
            res.send(buffer);
        });
    } catch (error) {
        res.status(500).json({ error: "Conversion failed", details: error.message });
    }
}







async function convertImageTo_HEIC(req, res) {
    try {
        console.log("Received request to convert image");

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const inputPath = req.file.path;
        const outputPath = inputPath.replace(/\.[^.]+$/, ".heic");

        // await sharp(inputPath)
        //     .toFormat("heif", { compression: "hevc", quality: 90 }) // ✅ Explicitly set compression
        //     .toFile(outputPath);
            await sharp(inputPath)
            .toFormat("avif", { quality: 90 })  // Use AVIF instead of HEIC
            .toFile(outputPath);

        console.log("Image converted successfully");

        res.sendFile(path.resolve(outputPath));
    } catch (error) {
        console.error("Conversion failed:", error);
        res.status(500).json({ success: false, message: "Conversion failed", details: error.message });
    }
}





const convertImagesToJPEG = (req, res) => convertImages(req, res, "jpeg");
const convertImagesToPNG = (req, res) => convertImages(req, res, "png");
const convertImagesToJPG = (req, res) => convertImages(req, res, "jpg");
const convertImagesToWEBP = (req, res) => convertImages(req, res, "webp");
const convertImagesToGIF = (req, res) => convertImages(req, res, "gif");
const convertImagesToTIFF = (req, res) => convertImages(req, res, "tiff");
const convertImagesToBMP = (req, res) => convertImages(req, res, "bmp");
const convertImagesToSVG = (req, res) => convertImages(req, res, "svg");
const convertImagesToHEIC = (req, res) => convertImages(req, res, "heic");


export { convertImagesToPDF,
    convertImagesToBMP,
    convertImagesToGIF,
    convertImagesToHEIC,
    convertImagesToJPEG,
    convertImagesToJPG,
    convertImagesToPNG,
    convertImagesToSVG,
    convertImagesToTIFF,
    convertImagesToWEBP,
 };
