import express from "express";
import {
  formSubmit,
  getAllforms,
  submittedForm,
  deleteform,
} from "../controllers/serviceMailBox.controller.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/", formSubmit);
router.get("/", protect, getAllforms);
router.post("/delete", protect, deleteform);
router.get("/:id", protect, submittedForm);

export default router;
