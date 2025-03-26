import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {
    convertImagesToPDF,
    splitPdf,
    mergePdfs,
} from "../controllers/pdfTools.controller.js"

const router=Router()
router.route("/ToPDF").post(upload.array("images"), convertImagesToPDF);
router.route("/ToSplit").post(upload.array("pdfs"),splitPdf)
router.route("/ToMergePdf").post(upload.array("pdfs"),mergePdfs)

export default router