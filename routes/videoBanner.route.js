import express from "express";
import {
  videoBannerUpload,
  publicVideoBanner,
  cmsVideoBanner,
  videoBannerDelete,
  updateVideoBanner,
} from "../controllers/videoBanner.controller.js";
import { singleVideo } from "../middlewares/videoUploadMiddleware.js";
import { protect } from "../controllers/auth.controller.js";
import domainExtracter from "../middlewares/domainExtracter.js";

const router = express.Router();

router.post("/videos/banners", protect, singleVideo, videoBannerUpload);
router.get("/videos/banners/public", domainExtracter, publicVideoBanner);
router.get("/videos/banners/cms", protect, cmsVideoBanner);
router.delete("/videos/banners/:id", protect, videoBannerDelete);
router.patch("/videos/banners/:id", protect, singleVideo, updateVideoBanner);
export default router;
