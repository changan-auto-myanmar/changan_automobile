import express from "express";
import {
  bannerUpload,
  publicBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/banner.controller.js";
import { protect } from "../controllers/auth.controller.js";
import upload from "../middlewares/multerImageUpload.middleware.js";

const router = express.Router();

router.post("/banners", protect, upload.single("url"), bannerUpload);
router.get("/banners", publicBanner);
router.patch("/banners/:id", protect, upload.single("url"), updateBanner);
router.delete("/banners/:id", protect, deleteBanner);

export default router;
