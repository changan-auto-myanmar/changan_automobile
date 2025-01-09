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

const router = express.Router();

router.post("/car-overview", multiImage, createBrandOverview);
router.get("/car-overview", getAllbrandOverview);
router.get("/car-overview/:id", getById);
router.post("/car-overview/:id", multiImage, additionalUpload);
router.delete("/car-overview/:id", deleteBrandOverview);
router.delete("/car-overview/:id/image/:imageId", brandOverviewImageDelete);

export default router;
