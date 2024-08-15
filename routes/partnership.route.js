import express from "express";
import { protect } from "../controllers/auth.controller.js";
import { singleImage } from "../middlewares/imageUploadMiddleware.js";
import {
  partnershipUpload,
  partnershipPublic,
  partnershipCms,
  partnershipUpdate,
  partnershipDelete,
} from "../controllers/partnership.controller.js";
import domainExtracter from "../middlewares/domainExtracter.js";

const router = express.Router();

router.post("/partnerships", protect, singleImage, partnershipUpload);
router.get("/partnerships/public", domainExtracter, partnershipPublic);
router.get("/partnerships/cms", protect, partnershipCms);
router.patch("/partnerships/:id", protect, singleImage, partnershipUpdate);
router.delete("/partnerships/:id", protect, partnershipDelete);

export default router;
