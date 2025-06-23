import express from "express";
import {
  createChanganShowcase,
  getAllShowcases,
  getShowcaseById,
  updateShowcaseMainText,
  updateShowcaseSingleTopLevelImage,
  updateShowcaseCarColorText,
  updateShowcaseCarColorImages,
  updateImageInArrayField,
  deleteChanganShowcase,
} from "../controllers/changanShowcase.controller.js";
import { protect } from "../controllers/auth.controller.js";
import uploadChanganShowcase from "../middlewares/multerChanganShowcaseUpload.middleware.js";
import multer from "multer";
import CustomError from "../utils/customError.js";
const router = express.Router();

const commonFileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new CustomError(400, "Only image, video, or PDF files are allowed."));
  }
};

const showcaseUploadFields = [
  { name: "mockup", maxCount: 1 },
  { name: "car_banner", maxCount: 1 },
  { name: "car_brochure", maxCount: 1 },

  { name: "car_exterior", maxCount: 10 },
  { name: "car_interior", maxCount: 10 },
  { name: "gallery", maxCount: 20 },

  { name: "car_color_images", maxCount: 10 },
  { name: "car_color_swatches", maxCount: 10 },
];

const uploadSingleImageInArrayUpdate = multer({
  storage: multer.memoryStorage(),
  fileFilter: commonFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for the single file
});

router.post(
  "/changan-showcase",
  uploadChanganShowcase.fields(showcaseUploadFields),
  createChanganShowcase
);

router.patch(
  "/changan-showcase/image/:id/:arrayName/:imageId",
  uploadSingleImageInArrayUpdate.single("file"),
  updateImageInArrayField
);
router.patch(
  "/changan-showcase/image/:id",
  uploadChanganShowcase.fields(showcaseUploadFields),
  updateShowcaseSingleTopLevelImage
);
router.patch("/changan-showcase/text/:id", updateShowcaseMainText);
router.patch(
  "/changan-showcase/car-color-text/:id/:colorId",
  updateShowcaseCarColorText
);
router.patch(
  "/changan-showcase/car-color-image/:id/:colorId",
  uploadChanganShowcase.fields(showcaseUploadFields),
  updateShowcaseCarColorImages
);

router.get("/changan-showcase", getAllShowcases);
router.get("/changan-showcase/:id", getShowcaseById);
router.delete("/changan-showcase/:id", deleteChanganShowcase);
export default router;
