
import cors from "cors";  // ✅ Corrected
import express from "express";

const app = express();
console.log("app.js is started");
const url= process.env.CORS_ORIGIN || "http://localhost:5173"
app.use(cors({
    origin: url,
    credentials: true   // ✅ Fixed property name
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));




// Routes importn
import imageToOtherFormatesRouter from "./routes/imageToOtherFormates.router.js";
import pdfToolsRouter from "./routes/pdfTools.router.js"
console.log("router is initilaized")
// Initialize userRouter
app.use("/api/v1/image", imageToOtherFormatesRouter);  // ✅ Added leading slash
app.use("/api/v1/pdf",pdfToolsRouter)




export { app };