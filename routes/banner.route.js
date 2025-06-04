import express from "express";
import {
  bannerUpload,
  publicBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/banner.controller.js";
import { protect } from "../controllers/auth.controller.js";
import multerImageUpload from "../middlewares/multerImageUpload.middleware.js";

const router = express.Router();

router.post(
  "/banners",
  protect,
  multerImageUpload.single("bannerImageUrl"),
  bannerUpload
);
router.get("/banners", publicBanner);
router.patch(
  "/banners/:id",
  protect,
  multerImageUpload.single("bannerImageUrl"),
  updateBanner
);
router.delete("/banners/:id", protect, deleteBanner);

export default router;
