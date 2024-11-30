import express from "express";
import {
  formSubmit,
  getAllforms,
  submittedForm,
  deleteform,
} from "../controllers/serviceMailBox.controller.js";

const router = express.Router();

router.post("/", formSubmit);
router.get("/", getAllforms);
router.post("/delete", deleteform);
router.get("/:id", submittedForm);

export default router;
