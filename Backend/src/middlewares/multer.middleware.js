import multer from "multer";
import path from "path";

// Multer storage configuration
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

// Multer upload instance
export const upload = multer({ storage });
