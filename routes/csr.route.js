import express from "express";
import {
  csrUpload,
  csrAdditionalUpload,
  csrPublic,
  // csrCms,
  csrUpdate,
  csrDelete,
  csrImageDelete,
  getCsrPublicById,
  // getCsrCmsById,
} from "../controllers/csr.controller.js";
import { protect } from "../controllers/auth.controller.js";
import domainExtracter from "../middlewares/domainExtracter.js";
import {
  multiImage,
  singleImage,
} from "../middlewares/imageUploadMiddleware.js";
const router = express.Router();

// router.post("/csr", protect, multiImage, csrUpload);
// router.get("/csr/public", domainExtracter, csrPublic);
// router.get("/csr/cms", protect, csrCms);
// router.get("/csr/public/:id", protect, getCsrPublicById);
// router.get("/csr/cms/:id", protect, getCsrCmsById);
// router.post("/csr/:id", protect, multiImage, csrAdditionalUpload);
// router.patch("/csr/:id", protect, multiImage, csrUpdate);
// router.delete("/csr/:id/image/:imageId", protect, csrImageDelete);
// router.delete("/csr/:id", protect, csrDelete);

router.post("/csr", protect, multiImage, csrUpload);
router.get("/csr/public", csrPublic);
// router.get("/csr/cms", protect, csrCms);
router.get("/csr/public/:id", getCsrPublicById);
// router.get("/csr/cms/:id", protect, getCsrCmsById);
router.post("/csr/:id", protect, multiImage, csrAdditionalUpload);
router.patch("/csr/:id", protect, multiImage, csrUpdate);
router.delete("/csr/:id/image/:imageId", protect, csrImageDelete);
router.delete("/csr/:id", protect, csrDelete);

export default router;
