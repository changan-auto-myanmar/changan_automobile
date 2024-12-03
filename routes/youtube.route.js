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

router.post("/", addVideo);
router.get("/", getAllVideos);
router.get("/:id", getVideoById);
router.delete("/:id", deleteVideoById);
router.patch("/:id", updateVideoById);

export default router;
