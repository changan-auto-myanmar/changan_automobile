import express from "express";
import {
  formSubmit,
  getAllforms,
  submittedForm,
  deleteform,
} from "../controllers/contactMailBox.controller.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/", formSubmit);
router.get("/", protect, getAllforms);
router.get("/:id", protect, submittedForm);
router.post("/delete", protect, deleteform);

export default router;
