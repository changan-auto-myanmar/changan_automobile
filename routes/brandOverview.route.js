import express from "express";
import {
  createBrandOverview,
  getAllbrandOverview,
  getBrandOverviewByCarBrand,
  updateBrandOverview,
  addImagesToBrandOverview,
  deleteImagesFromBrandOverview,
  deleteBrandOverview,
} from "../controllers/brandOverview.controller.js";
import upload from "../middlewares/multerImageUpload.middleware.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.post(
  "/car-overview",
  upload.array("brandImageUrls", 8),
  createBrandOverview
);
router.get("/car-overview", getAllbrandOverview);
router.get("/car-overview/:car_brand", getBrandOverviewByCarBrand);
router.patch(
  "/car-overview/:car_brand",
  upload.single("brandImageUrls"),
  updateBrandOverview
);
router.post(
  "/car-overview/add-images/:car_brand",
  upload.array("brandImageUrls", 8),
  addImagesToBrandOverview
);
router.delete("/car-overview/:car_brand", deleteBrandOverview);
router.delete(
  "/car-overview/delete-images/:car_brand",
  deleteImagesFromBrandOverview
);

export default router;
