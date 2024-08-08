import express from "express";
import {
  bannerUpload,
  publicBanner,
  cmsBanner,
  bannerDelete,
} from "../controllers/banner.controller.js";
import { single } from "../middlewares/imageUploadMiddleware.js";
import { protect } from "../controllers/auth.controller.js";
import domainExtracter from "../middlewares/domainExtracter.js";

const router = express.Router();

router.post("/banners", protect, single, bannerUpload);
router.get("/banners/public", domainExtracter, publicBanner);
router.get("/banners/cms", protect, cmsBanner);
router.delete("/banners/:id", protect, bannerDelete);
export default router;
