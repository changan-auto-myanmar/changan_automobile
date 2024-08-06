import express from "express";
import {
  updatePassword,
  updateUserData,
  deactivate,
  getAllUser,
} from "../controllers/user.controller.js";
import { protect, restrict } from "../controllers/auth.controller.js";

const router = express.Router();

router.patch("/password", protect, updatePassword);
router.patch("/data", protect, updateUserData);
router.delete("/", protect, deactivate);
router.get("/", protect, restrict("superadmin"), getAllUser);

export default router;
