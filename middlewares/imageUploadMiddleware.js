import multer from "multer";
import CustomError from "../utils/customError.js";

// Image storage settings
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (req.path.includes("/banners")) {
      uploadPath = "public/banners";
    } else if (req.path.includes("/companies/logo")) {
      uploadPath = "public/companies-logo";
    } else if (req.path.includes("/partnerships")) {
      uploadPath = "public/partnerships";
    } else if (req.path.includes("/csr")) {
      uploadPath = "public/csr";
    } else if (req.path.includes("/csr")) {
      uploadPath = "public/csr";
    } else {
      uploadPath = "public/others";
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Image file filter
const imageFileFilter = function (req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new CustomError(400, "Invalid file type. Only images are allowed."),
      false
    );
  }
};

// Image upload middleware
export const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit for images
    files: 10,
  },
});

export const singleImage = (req, res, next) => {
  imageUpload.single("image")(req, res, (error) => {
    if (error) {
      return next(error);
    }
    next();
  });
};

export const multiImage = (req, res, next) => {
  console.log("Middleware: Start of image upload process.");

  // Use imageUpload.array() to handle multiple file uploads with the 'images' field
  imageUpload.array("images", 10)(req, res, (error) => {
    if (error) {
      console.log("Multer error:", error); // Log Multer error if any

      // Check for Multer-specific errors and handle them
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        console.log("Unexpected field or incorrect field name."); // Log specific error
        return next(
          new CustomError(400, "Unexpected field or incorrect field name")
        );
      } else if (error.code === "LIMIT_FILE_COUNT") {
        console.log("Maximum file count exceeded. Only 10 images allowed."); // Log specific error
        return next(
          new CustomError(400, "You can upload a maximum of 10 images")
        );
      } else {
        return next(error); // Pass other errors to the next error handler
      }
    }

    console.log("Middleware: Successfully uploaded files:", req.files); // Log the uploaded files
    // Proceed to the next middleware if there are no errors
    next();
  });
};
