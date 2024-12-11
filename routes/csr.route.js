import express from "express";
import {
  csrUpload,
  csrPublic,
  csrCms,
  csrUpdate,
  csrDelete,
} from "../controllers/csr.controller.js";
import { protect } from "../controllers/auth.controller.js";
import domainExtracter from "../middlewares/domainExtracter.js";
import {
  multiImage,
  singleImage,
} from "../middlewares/imageUploadMiddleware.js";
const router = express.Router();

router.post("/csr", protect, singleImage, csrUpload);
// router.post("/csr/:id", protect, singleImage, csrAdditionalUpload);
router.get("/csr/public", domainExtracter, csrPublic);
router.get("/csr/cms", protect, csrCms);
router.patch("/csr/:id", protect, singleImage, csrUpdate);
// router.delete("/csr/:id/image/:imageId", protect, csrImageDelete);
router.delete("/csr/:id", protect, csrDelete);

export default router;
