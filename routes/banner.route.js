import express from "express";
import {
  bannerUpload,
  publicBanner,
  cmsBanner,
  bannerDelete,
  updateBanner,
} from "../controllers/banner.controller.js";
import { singleImage } from "../middlewares/imageUploadMiddleware.js";
import { protect } from "../controllers/auth.controller.js";
import domainExtracter from "../middlewares/domainExtracter.js";

const router = express.Router();

router.post("/banners", protect, singleImage, bannerUpload);
router.get("/banners/public", domainExtracter, publicBanner);
router.get("/banners/cms", protect, cmsBanner);
router.delete("/banners/:id", protect, bannerDelete);
router.patch("/banners/:id", protect, singleImage, updateBanner);
export default router;
