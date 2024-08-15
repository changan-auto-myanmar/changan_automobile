import express from "express";
import domainExtracter from "../middlewares/domainExtracter.js";
import { singleImage } from "../middlewares/imageUploadMiddleware.js";
import { protect } from "../controllers/auth.controller.js";
import {
  companyLogoUpload,
  publicCompanyLogo,
  cmsCompanyLogo,
  CompanyLogoDelete,
  CompanyLogoUpdate,
} from "../controllers/companyLogo.controller.js";

const router = express.Router();

router.post("/companies/logo", protect, singleImage, companyLogoUpload);
router.get("/companies/logo/public", domainExtracter, publicCompanyLogo);
router.get("/companies/logo/cms", protect, cmsCompanyLogo);
router.delete("/companies/logo/:id", protect, CompanyLogoDelete);
router.patch("/companies/logo/:id", protect, singleImage, CompanyLogoUpdate);

export default router;
