import express from "express";
import {
  signup,
  login,
  protect,
  restrict,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", protect, restrict("superadmin"), signup);
router.post("/login", login);
export default router;
