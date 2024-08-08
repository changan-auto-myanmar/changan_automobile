import express from "express";
import { bannerUpload } from "../controllers/banner.controller.js";
import { single } from "../middlewares/imageUploadMiddleware.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/banners", protect, single, bannerUpload);
export default router;
