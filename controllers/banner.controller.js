import Banner from "../models/banner.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import path from "path";

export const bannerUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError(400, "No Image to upload"));
  }
  const { filename, path: filepath } = req.file;
  const domainName = req.user.domainName;
  const newBanner = new Banner({ filename, filepath, domainName });
  const savedBanner = await newBanner.save();
  const { __v, uploadDate, ...rest } = savedBanner._doc;
  res.status(201).json({
    code: 201,
    status: "success",
    message: "Banner Image Uploaded Successfully.",
    data: {
      banner: rest,
    },
  });
});
