import Banner from "../models/banner.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import {
  imageUploadToCloudinary,
  extractPublicId,
} from "../utils/cloudniaryImageUpload.utils.js";
import { v2 as cloudinary } from "cloudinary";

export const bannerUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(
      new CustomError(400, "No image file provided for banner upload.")
    );
  }

  const folderName = "changan/banners";
  let bannerImageUrl;

  try {
    const resultUrl = await imageUploadToCloudinary(
      req.file.buffer,
      folderName
    );
    bannerImageUrl = resultUrl;

    if (!bannerImageUrl) {
      return next(
        new CustomError(500, "Failed to get image URL from Cloudinary.")
      );
    }
  } catch (error) {
    return next(error);
  }

  const newBanner = new Banner({ bannerImageUrl });
  const savedBanner = await newBanner.save(); // This already uses await correctly

  const bannerResponse = savedBanner.toObject();
  delete bannerResponse.__v;
  if (bannerResponse.uploadDate) {
    delete bannerResponse.uploadDate;
  }

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Banner Image Uploaded Successfully.",
    data: {
      banner: bannerResponse,
    },
  });
});

export const publicBanner = asyncErrorHandler(async (req, res, next) => {
  const banners = await Banner.find({});

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner Image Fetched Successfully.",
    data: {
      banners,
    },
  });
});

export const updateBanner = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  let updateData = { ...req.body };

  const existingBanner = await Banner.findById(id);

  if (!existingBanner) {
    return next(new CustomError(404, "No banner found with that ID."));
  }

  if (req.file) {
    const folderName = "changan/banners";
    const newBannerImageUrl = await imageUploadToCloudinary(
      req.file.buffer,
      folderName
    );

    if (!newBannerImageUrl) {
      return next(
        new CustomError(500, "Failed to upload new image to Cloudinary.")
      );
    }

    updateData.bannerImageUrl = newBannerImageUrl;

    if (existingBanner.bannerImageUrl) {
      const publicId = extractPublicId(existingBanner.bannerImageUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (destroyError) {
          console.error(
            "Error deleting old image from Cloudinary:",
            destroyError
          );
        }
      }
    }
  }

  // 5. Update the banner in the database
  const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedBanner) {
    return next(new CustomError(404, "No banner found with that ID."));
  }

  const bannerResponse = updatedBanner.toObject();
  delete bannerResponse.createdAt; // Use createdAt instead of uploadDate
  delete bannerResponse.updatedAt;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner updated successfully.",
    data: {
      banner: bannerResponse,
    },
  });
});

export const deleteBanner = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const bannerToDelete = await Banner.findById(id);

  if (!bannerToDelete) {
    return next(new CustomError(404, "No banner found with that ID."));
  }

  if (bannerToDelete.bannerImageUrl) {
    const publicId = extractPublicId(bannerToDelete.bannerImageUrl);

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Cloudinary image ${publicId} deleted successfully.`);
      } catch (destroyError) {
        console.error(
          "Error deleting image from Cloudinary:",
          destroyError.message || destroyError
        );
        return res.status(500).json({
          status: "error",
          message:
            "Failed to delete image from Cloudinary. Banner not deleted from database.",
          error: destroyError.message || "Unknown Cloudinary error.",
        });
      }
    }
  }

  const deletedBanner = await Banner.findByIdAndDelete(id);

  if (!deletedBanner) {
    return next(
      new CustomError(404, "No banner found with that ID to delete.")
    );
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner deleted successfully.",
  });
});
