import express from "express";
import {
  formSubmit,
  getAllforms,
  submittedForm,
  deleteform,
} from "../controllers/contactMailBox.controller.js";

const router = express.Router();

router.post("/", formSubmit);
router.get("/", getAllforms);
router.get("/:id", submittedForm);
router.post("/delete", deleteform);

export default router;
