import express from "express";
import domainExtracter from "../middlewares/domainExtracter.js";
import { single } from "../middlewares/imageUploadMiddleware.js";
import { protect } from "../controllers/auth.controller.js";
import {
  companyLogoUpload,
  publicCompanyLogo,
  cmsCompanyLogo,
  CompanyLogoDelete,
  CompanyLogoUpdate,
} from "../controllers/companyLogo.controller.js";

const router = express.Router();

router.post("/companies/logo", protect, single, companyLogoUpload);
router.get("/companies/logo/public", domainExtracter, publicCompanyLogo);
router.get("/companies/logo/cms", protect, cmsCompanyLogo);
router.delete("/companies/logo/:id", protect, CompanyLogoDelete);
router.patch("/companies/logo/:id", protect, single, CompanyLogoUpdate);

export default router;
