import multer from "multer";
import CustomError from "../utils/customError.js";
// Define storage settings with dynamic destination
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    // Determine the upload path based on the API endpoint
    if (req.path.includes("/banners")) {
      uploadPath = "public/banners";
    } else if (req.path.includes("/logos")) {
      uploadPath = "public/logos";
    } else {
      uploadPath = "public/others"; // Default path for other uploads
    }

    cb(null, uploadPath); // Set the upload path dynamically
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Rename the uploaded file with a timestamp and its original name
  },
});

// Define file filter to allow only images
const fileFilter = function (req, file, cb) {
  // Allowed file types
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(
      new CustomError(400, "Invalid file type. Only images are allowed."),
      false
    ); // Reject file
  }
};

// Configure Multer with storage settings and file filter
const multerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // Limit file size to 3MB per file
  },
});

export const single = (req, res, next) => {
  multerUpload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return next(new CustomError(400, error.message));
    } else if (error) {
      return next(new CustomError(500, error.message));
    }
    next();
  });
};

export const multi = (req, res, next) => {
  multerUpload.array("images", 10)(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return next(new CustomError(400, error.message));
    } else if (error) {
      return next(new CustomError(500, error.message));
    }
    next();
  });
};
