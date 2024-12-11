import multer from "multer";

import path from "path";

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;

    if (req.path.includes("/showcase")) {
      uploadPath = "public/showcase";
    } else {
      uploadPath = "public/others";
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
    "application/pdf", // Added PDF MIME type
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

    limits: { fileSize: 50 * 1024 * 1024 },
  });

  const uploadFields = fieldsConfig.map((field) => {
    return multerUpload.any();
  });

  return (req, res, next) => {
    multerUpload.any()(req, res, (error) => {
      if (error) {
        return next(error);
      }
      console.log(
        "Capture failed:",
        req.files.map((file) => file.filename)
      );
      next();
    });
  };
};
