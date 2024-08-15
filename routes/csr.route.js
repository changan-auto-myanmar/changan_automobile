import express from "express";
import {
  csrUpload,
  csrPublic,
  csrCms,
  csrUpdate,
  csrImageDelete,
  csrAdditionalUpload,
  csrDocDelete,
} from "../controllers/csr.controller.js";
import { protect } from "../controllers/auth.controller.js";
import domainExtracter from "../middlewares/domainExtracter.js";
import { multi, single } from "../middlewares/imageUploadMiddleware.js";
const router = express.Router();

router.post("/csr", protect, multi, csrUpload);
router.post("/csr/:id", protect, multi, csrAdditionalUpload);
router.get("/csr/public", domainExtracter, csrPublic);
router.get("/csr/cms", protect, csrCms);
router.patch("/csr/:id", protect, single, csrUpdate);
router.delete("/csr/:id/image/:imageId", protect, csrImageDelete);
router.delete("/csr/:id", protect, csrDocDelete);

export default router;
