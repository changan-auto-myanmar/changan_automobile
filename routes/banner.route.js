import express from "express";
import {
  bannerUpload,
  publicBanner,
  bannerDelete,
  updateBanner,
} from "../controllers/banner.controller.js";
import { singleImage } from "../middlewares/imageUploadMiddleware.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/banners", protect, singleImage, bannerUpload);
router.get("/banners/public", publicBanner);
router.delete("/banners/:id", protect, bannerDelete);
router.patch("/banners/:id", protect, singleImage, updateBanner);
export default router;
