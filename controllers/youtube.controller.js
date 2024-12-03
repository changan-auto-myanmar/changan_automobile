import youtubeVideo from "../models/youtube.model.js";
import extractYouTubeId from "../utils/youtubeIdExtraction.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

export const addVideo = asyncErrorHandler(async (req, res, next) => {
  const { url } = req.body;

  if (!url) {
    return next(new CustomError(400, " Youtube Url is required."));
  }

  const video_id = extractYouTubeId(url);
  if (!video_id) {
    return next(new CustomError(400, "Invalid Youtube URL."));
  }

  const videoCount = await youtubeVideo.countDocuments();
  if (videoCount >= 4) {
    return next(
      new CustomError(
        400,
        "Video limit reached. You can only add up to 4 videos."
      )
    );
  }

  const newVideo = new youtubeVideo({ video_id });
  await newVideo.save();

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Youtube Video successfully added.",
  });
});

export const getAllVideos = asyncErrorHandler(async (req, res, next) => {
  const videos = await youtubeVideo.find();

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Youtube videos data successfully retrived.",
    data: {
      video_id: videos,
    },
  });
});

export const getVideoById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const video = await youtubeVideo.findById(id);

  if (!video) {
    return next(new CustomError(404, "Video does not exist."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "YouTube video retrieved successfully.",
    data: video,
  });
});

export const deleteVideoById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const video = await youtubeVideo.findByIdAndDelete(id);

  if (!video) {
    return next(new CustomError(404, "Video not found."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "YouTube video deleted successfully.",
    data: video,
  });
});

export const updateVideoById = asyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: "YouTube URL is required." });
  }

  const video_id = extractYouTubeId(url);
  if (!video_id) {
    return res.status(400).json({ message: "Invalid YouTube URL." });
  }

  const video = await youtubeVideo.findByIdAndUpdate(
    id,
    { video_id },
    { new: true }
  );

  if (!video) {
    return res.status(404).json({ message: "Video not found." });
  }

  res.status(200).json({
    message: "YouTube video updated successfully.",
    data: video,
  });
});
