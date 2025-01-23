import express from "express";
import { multiImage } from "../middlewares/imageUploadMiddleware.js";
import {
  createBrandOverview,
  getAllbrandOverview,
  getById,
  additionalUpload,
  deleteBrandOverview,
  brandOverviewImageDelete,
} from "../controllers/brandOverview.controller.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/car-overview", protect, multiImage, createBrandOverview);
router.get("/car-overview", getAllbrandOverview);
router.get("/car-overview/:id", getById);
router.post("/car-overview/:id", protect, multiImage, additionalUpload);
router.delete("/car-overview/:id", protect, deleteBrandOverview);
router.delete(
  "/car-overview/:id/image/:imageId",
  protect,
  brandOverviewImageDelete
);

export default router;
