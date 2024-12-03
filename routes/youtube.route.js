import express from "express";
import { addVideo, getAllVideos } from "../controllers/youtube.controller.js";
import { protect } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/", addVideo);
router.get("/", getAllVideos);

export default router;
