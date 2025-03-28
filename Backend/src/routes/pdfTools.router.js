import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { uploadOnlyPdf } from "../middlewares/multer_OnlyAcceptPdf.middlewatre.js";
import {
    convertImagesToPDF,
    splitPdf,
    mergePdfs,
    removePagesFromPdf,
    extractPagesFromPdf,
    protectPdf,
} from "../controllers/pdfTools.controller.js"

const router=Router()
router.route("/ToPDF").post(upload.array("images"), convertImagesToPDF);
router.route("/ToSplit").post(uploadOnlyPdf.single("pdf"),splitPdf)
router.route("/ToMergePdf").post(upload.array("pdfs"),mergePdfs)
router.route("/ToRemovePageFromPdf").post(uploadOnlyPdf.single("pdf"),removePagesFromPdf)
router.route("/ToExtractPagesFromPdf").post(uploadOnlyPdf.single("pdf"),extractPagesFromPdf)
router.route("/ToProtectPdf").post(uploadOnlyPdf.single("pdf"),protectPdf)
export default router