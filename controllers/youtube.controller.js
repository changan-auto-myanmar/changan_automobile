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
  if (videoCount >= 5) {
    return next(
      new CustomError(
        400,
        "Video limit reached. You can only add up to 5 videos."
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
