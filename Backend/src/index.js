import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Closing server...");
  server.close(() => {
    console.log("Server closed. Exiting process...");
    process.exit(0);
  });
});


// import cors from "cors";
// import express from "express";
// import dotenv from "dotenv";

// dotenv.config(); // Load environment variables from .env file

// const app = express();

// // ✅ Explicitly allow frontend origin and set proper CORS headers
// app.use(cors({
//     origin: "http://localhost:5173", // Explicitly allow frontend origin
//     credentials: true,  // Allow cookies and authentication headers
    
// }));

// app.get('/', (req, res) => {
//     res.send('Server is ready');
// });

// app.get('/api/v1/jokes', (req, res) => {
//     const jokes = [
//         {
//             id: 1,
//             title: "Kapil Sharma Show",
//             content: "Aaj dekhe Kapil Sharma ki Bajirao Mastani"
//         },
//         {
//             id: 2,
//             title: "Sunil Grover Show",
//             content: "Sunil Grover as Salman Khan role"
//         }
//     ];
    
//     res.status(200).json(jokes);
// });

// const port = process.env.PORT || 5000;
// app.listen(port, () => {
//     console.log(`Server is listening at http://localhost:${port}`);
// });

