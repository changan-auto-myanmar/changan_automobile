import multer from "multer";
import CustomError from "../utils/customError.js";

// Video storage settings
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (req.path.includes("/videos")) {
      uploadPath = "public/videos";
    } else {
      uploadPath = "public/others";
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Video file filter
const videoFileFilter = function (req, file, cb) {
  const allowedMimeTypes = [
    "video/mp4",
    "video/avi",
    "video/mkv",
    "video/quicktime",
    "video/webm",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new CustomError(400, "Invalid file type. Only videos are allowed."),
      false
    );
  }
};

// Video upload middleware
export const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
});

export const singleVideo = (req, res, next) => {
  videoUpload.single("video")(req, res, (error) => {
    if (error) {
      return next(error);
    }
    next();
  });
};

export const multiVideo = (req, res, next) => {
  videoUpload.array("videos", 5)(req, res, (error) => {
    if (error) {
      return next(error);
    }
    next();
  });
};
