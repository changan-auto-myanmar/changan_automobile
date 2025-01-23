import express from "express";
import {
  addVideo,
  getAllVideos,
  getVideoById,
  deleteVideoById,
  updateVideoById,
} from "../controllers/youtube.controller.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/", protect, addVideo);
router.get("/", getAllVideos);
router.get("/:id", getVideoById);
router.delete("/:id", protect, deleteVideoById);
router.patch("/:id", protect, updateVideoById);

export default router;
