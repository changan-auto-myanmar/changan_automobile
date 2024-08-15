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
    ,
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
  imageUpload.array("images", 10)(req, res, (error) => {
    if (error) {
      return next(error);
    }

    next();
  });
};
