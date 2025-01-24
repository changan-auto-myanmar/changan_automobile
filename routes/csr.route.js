import express from "express";
import {
  csrUpload,
  csrAdditionalUpload,
  csrPublic,
  csrUpdate,
  csrDelete,
  csrImageDelete,
  getCsrPublicById,
} from "../controllers/csr.controller.js";
import { protect } from "../controllers/auth.controller.js";
import { multiImage } from "../middlewares/imageUploadMiddleware.js";
const router = express.Router();

router.post("/csr", protect, multiImage, csrUpload);
router.get("/csr/public", csrPublic);
router.get("/csr/public/:id", getCsrPublicById);
router.post("/csr/:id", protect, multiImage, csrAdditionalUpload);
router.patch("/csr/:id", protect, multiImage, csrUpdate);
router.delete("/csr/:id/image/:imageId", protect, csrImageDelete);
router.delete("/csr/:id", protect, csrDelete);

export default router;
