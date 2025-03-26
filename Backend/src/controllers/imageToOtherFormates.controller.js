import path from "path";
import fs from "fs";
import sharp from "sharp";


const FORMAT_MAP = {
  ToJPEG: { ext: "jpeg", mime: "image/jpeg" },
  ToJPG: { ext: "jpg", mime: "image/jpeg" },
  ToPNG: { ext: "png", mime: "image/png" },
  ToWEBP: { ext: "webp", mime: "image/webp" },
  ToGIF: { ext: "gif", mime: "image/gif" },
  ToTIFF: { ext: "tiff", mime: "image/tiff" }
};

const convertImages = async (req, res, format) => {
  try {
    const { ext, mime } = FORMAT_MAP[format] || { ext: "jpeg", mime: "image/jpeg" };
    
    const convertedFiles = await Promise.all(req.files.map(async (file) => {
      const originalName = path.basename(file.originalname, path.extname(file.originalname));
      const outputName = `${originalName}.${ext}`;
      const outputPath = path.join("public/ConvertedFiles", outputName);

      // Convert with Sharp
      await sharp(file.path)
        .toFormat(ext)
        .toFile(outputPath);

      // Read and clean up
      const buffer = fs.readFileSync(outputPath);
      fs.unlinkSync(outputPath);
      
      return {
        name: outputName,
        buffer: buffer.toString("base64"),
        mimeType: mime
      };
    }));

    // Cleanup uploaded files
    req.files.forEach(f => fs.unlinkSync(f.path));

    res.status(200).json({
      convertedFiles,
      message: `Converted to ${ext.toUpperCase()} successfully`
    });

  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({ error: "Conversion failed" });
  }
};











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


export { 
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
