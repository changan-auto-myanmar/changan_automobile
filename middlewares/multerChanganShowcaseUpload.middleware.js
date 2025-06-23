import multer from "multer";
import CustomError from "../utils/customError.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // Example: 10 MB limit per file

const storage = multer.memoryStorage(); // Store files in memory as buffers

const fileFilter = (req, file, cb) => {
  // Allow common image types and potentially video types if gallery supports it
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("application/pdf")
  ) {
    cb(null, true);
  } else {
    cb(
      new CustomError(
        400,
        "Only image or video files are allowed for showcase content."
      ),
      false
    );
  }
};

const uploadChanganShowcase = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export default uploadChanganShowcase;
