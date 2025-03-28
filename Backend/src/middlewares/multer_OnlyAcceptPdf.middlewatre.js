import multer from "multer";
import path from "path";
import {ApiError} from "../utils/ApiError.js";

// Multer storage configuration (keep your existing disk storage)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); // Save files in 'public/temp' directory
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);

        const now = new Date();
        const timestamp = now.toISOString().replace(/[-T:]/g, "").replace(/\..+/, "");
        const milliseconds = now.getMilliseconds();
        const microseconds = process.hrtime.bigint() % 1000n;
        const randomNum = Math.floor(Math.random() * 1e6); // Random number (0-999999)

        const uniqueName = `${baseName}_${timestamp}${milliseconds}${microseconds}_${randomNum}${ext}`;
        console.log(`📸 Uploaded file: ${file.originalname} → Saved as: ${uniqueName}`);
      
        cb(null, uniqueName);
    }
});

// Enhanced Multer upload instance with limits and filter
export const uploadOnlyPdf = multer({
    storage,
    limits: {
        fileSize: 400 * 1024 * 1024, // 400MB limit
        files: 1 // Allow only single file upload
    },
    fileFilter: (req, file, cb) => {
        // Check file mimetype
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new ApiError(400, 'Only PDF files are allowed'), false);
        }
    }
});