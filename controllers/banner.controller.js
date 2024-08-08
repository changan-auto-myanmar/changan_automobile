import Banner from "../models/banner.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import fs from "fs";
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

export const publicBanner = asyncErrorHandler(async (req, res, next) => {
  const { domainName } = req;

  if (!domainName) {
    return next(new CustomError(400, "Domain name not found."));
  }

  const banners = await Banner.find({ domainName });

  if (banners.length === 0) {
    return next(new CustomError(404, "No banners found for this domain."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      banners,
    },
  });
});

export const cmsBanner = asyncErrorHandler(async (req, res, next) => {
  // Access domainName from the authenticated user's data
  const domainName = req.user.domainName;

  if (!domainName) {
    return next(
      new CustomError(400, "Domain name not found for the authenticated user.")
    );
  }

  // Fetch banners for the domain
  const banners = await Banner.find({ domainName });

  if (banners.length === 0) {
    return next(new CustomError(404, "No banners found for this domain."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      banners,
    },
  });
});

export const bannerDelete = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const domainName = req.user.domainName;

  const banner = await Banner.findOneAndDelete({ _id: id, domainName });

  if (!banner) {
    return next(
      new CustomError(404, "Banner not found or not authorized to delete")
    );
  }

  fs.unlinkSync(banner.filepath);

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner deleted successfully",
  });
});
