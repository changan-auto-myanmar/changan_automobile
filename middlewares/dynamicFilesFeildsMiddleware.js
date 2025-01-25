import multer from "multer";
import path from "path";
import fs from "fs";

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;

    if (req.path.includes("/showcase")) {
      uploadPath = "public/showcase";
    } else {
      uploadPath = "public/others";
    }

    // Auto-create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const imageFileFilter = function (req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf", // Allow PDFs
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only images and PDFs are allowed."),
      false
    );
  }
};

export const dynamicFieldsUpload = (fieldsConfig) => {
  const multerUpload = multer({
    storage: imageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
  });

  return (req, res, next) => {
    multerUpload.any()(req, res, (error) => {
      if (error) {
        return next(error);
      }

      if (req.files) {
        console.log(
          "Uploaded files:",
          req.files.map((file) => file.filename)
        );
      }

      next();
    });
  };
};
