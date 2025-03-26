
import cors from "cors";  // ✅ Corrected
import express from "express";

const app = express();
console.log("app.js is started");

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true   // ✅ Fixed property name
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.listen(process.env.PORT,()=>{
    console.log(`app is listening on ${process.env.PORT}`);
    
})

// Routes import
import imageToOtherFormatesRouter from "./routes/imageToOtherFormates.router.js";
import pdfToolsRouter from "./routes/pdfTools.router.js"
console.log("router is initilaized")
// Initialize userRouter
app.use("/api/v1/image", imageToOtherFormatesRouter);  // ✅ Added leading slash
app.use("/api/v1/pdf",pdfToolsRouter)




export { app };