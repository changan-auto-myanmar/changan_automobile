import express from "express";
import { bannerUpload } from "../controllers/banner.controller.js";
import { single } from "../middlewares/imageUploadMiddleware.js";

const router = express.Router();

router.post("/banners", single, bannerUpload);
export default router;
