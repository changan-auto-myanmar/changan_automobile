import VideoBanner from "../models/videoBanner.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import fs from "fs";
import path from "path";

export const videoBannerUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError(400, "No Video file to upload"));
  }
  const { filename, path: filepath } = req.file;
  const domainName = req.user.domainName;
  const newVideoBanner = new VideoBanner({ filename, filepath, domainName });
  const savedVideoBanner = await newVideoBanner.save();
  const { __v, uploadDate, ...rest } = savedVideoBanner._doc;
  res.status(201).json({
    code: 201,
    status: "success",
    message: "Video for Banner Uploaded Successfully.",
    data: {
      Video_banner: rest,
    },
  });
});

export const publicVideoBanner = asyncErrorHandler(async (req, res, next) => {
  const { domainName } = req;

  if (!domainName) {
    return next(new CustomError(400, "Domain name not found."));
  }

  const videoBanners = await VideoBanner.find({ domainName });

  if (videoBanners.length === 0) {
    return next(
      new CustomError(404, "No Video Banners found for this domain.")
    );
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      videoBanners,
    },
  });
});

export const cmsVideoBanner = asyncErrorHandler(async (req, res, next) => {
  // Access domainName from the authenticated user's data
  const domainName = req.user.domainName;

  if (!domainName) {
    return next(
      new CustomError(400, "Domain name not found for the authenticated user.")
    );
  }

  // Fetch banners for the domain
  const videoBanners = await VideoBanner.find({ domainName });

  if (videoBanners.length === 0) {
    return next(
      new CustomError(404, "No video banners found for this domain.")
    );
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      videoBanners,
    },
  });
});

export const updateVideoBanner = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { domainName } = req.user;

  // Find the banner by ID and domainName
  const currentVideoBanner = await VideoBanner.findOne({ _id: id, domainName });
  if (!currentVideoBanner) {
    return next(
      new CustomError(404, "Banner Video not found or not authorized to update")
    );
  }
  // Delete the old image file from the file system
  if (!req.file) {
    return next(new CustomError(400, "No video is selected to update"));
  } else {
    try {
      if (fs.existsSync(currentVideoBanner.filepath)) {
        await fs.promises.unlink(currentVideoBanner.filepath);
      } else {
        return next(new CustomError(404, "Current video not found"));
      }
    } catch (err) {
      return next(new CustomError(500, "Failed to delete the current video"));
    }
  }
  const { filename, path: filepath } = req.file;

  // Save the new image file to the file system

  // Update the banner with new image details
  const updatedVideoBanner = await VideoBanner.findByIdAndUpdate(
    id,
    { filename, filepath },
    { new: true }
  );

  if (!updatedVideoBanner) {
    return next(new CustomError(404, "Banner Video update failed"));
  }
  const { __v, uploadDate, ...rest } = updatedVideoBanner._doc;
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner Video updated successfully",
    data: {
      updatedVideoBanner: rest,
    },
  });
});

export const videoBannerDelete = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const domainName = req.user.domainName;

  const videoBanners = await VideoBanner.findOneAndDelete({
    _id: id,
    domainName,
  });

  if (!videoBanners) {
    return next(
      new CustomError(404, "Video Banner not found or not authorized to delete")
    );
  }
  try {
    if (fs.existsSync(videoBanners.filepath)) {
      await fs.promises.unlink(videoBanners.filepath);
    } else {
      return next(new CustomError(404, "Current video not found"));
    }
  } catch (err) {
    return next(new CustomError(500, "Failed to delete the current video"));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Video Banner deleted successfully",
  });
});
