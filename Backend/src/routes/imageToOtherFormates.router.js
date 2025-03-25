import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { 
    convertImagesToPDF, 
    convertImagesToJPEG, 
    convertImagesToPNG, 
    convertImagesToJPG, 
    convertImagesToWEBP, 
    convertImagesToGIF, 
    convertImagesToBMP,  // Ensure this matches the export
    convertImagesToTIFF, 
    convertImagesToSVG, 
    convertImagesToHEIC 
} from "../controllers/imageToOtherFormates.controller.js";


const router=Router();
console.log("inside image to other router formate")
router.route("/ToPDF").post(upload.array("images"), convertImagesToPDF);
router.route("/ToJPEG").post(upload.array("images"), convertImagesToJPEG);
router.route("/ToPNG").post(upload.array("images"), convertImagesToPNG);
router.route("/ToJPG").post(upload.array("images"), convertImagesToJPG);
router.route("/ToWEBP").post(upload.array("images"), convertImagesToWEBP);
router.route("/ToGIF").post(upload.array("images"), convertImagesToGIF);
router.route("/ToBMP").post(upload.array("images"), convertImagesToBMP);
router.route("/ToTIFF").post(upload.array("images"), convertImagesToTIFF);
router.route("/ToSVG").post(upload.array("images"), convertImagesToSVG);
router.route("/ToHEIC").post(upload.array("images"), convertImagesToHEIC);



 
 

export default router