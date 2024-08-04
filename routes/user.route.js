import express from "express";
import {
  updatePassword,
  updateUserData,
} from "../controllers/user.controller.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.patch("/password", protect, updatePassword);
router.patch("/data", protect, updateUserData);

export default router;
