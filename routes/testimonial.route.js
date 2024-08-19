import express from "express";
import { singleImage } from "../middlewares/imageUploadMiddleware.js";
import domainExtracter from "../middlewares/domainExtracter.js";
import { protect } from "../controllers/auth.controller.js";
import {
  createTestimonial,
  publicTestimonial,
  cmsTestimonial,
  testimonialUpdate,
  testimonialDelete,
} from "../controllers/testimonial.controller.js";

const router = express.Router();

router.post("/testimonials", protect, singleImage, createTestimonial);
router.get("/testimonials/public", domainExtracter, publicTestimonial);
router.get("/testimonials/cms", protect, cmsTestimonial);
router.patch("/testimonials/:id", protect, singleImage, testimonialUpdate);
router.delete("/testimonials/:id", protect, singleImage, testimonialDelete);
export default router;
