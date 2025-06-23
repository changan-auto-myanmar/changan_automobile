import Banner from "../models/banner.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import { imageUploadToCloudinary } from "../utils/cloudinaryImageUpload.utils.js";
import cloudinary from "../configs/cloudinary.config.js";

export const bannerUpload = asyncErrorHandler(async (req, res, next) => {
  // 1. Validate incoming file
  if (!req.file) {
    return next(
      new CustomError(400, "No image file provided for banner upload.")
    );
  }

  const folderName = "changan/banners";

  let url;
  let cloudinaryPublicId;

  // 2. Upload the image to Cloudinary
  try {
    const uploadResult = await imageUploadToCloudinary(
      req.file.buffer,
      folderName
    );

    url = uploadResult.url;
    cloudinaryPublicId = uploadResult.cloudinaryPublicId;

    if (!url || !cloudinaryPublicId) {
      return next(
        new CustomError(
          500,
          "Failed to get image URL or Public ID from Cloudinary after upload."
        )
      );
    }
  } catch (error) {
    console.error("Error during Cloudinary upload for banner:", error);
    return next(
      new CustomError(
        500,
        "Image upload to Cloudinary failed. Please try again."
      )
    );
  }

  // 3. Create a new Banner document in the database
  const newBanner = new Banner({
    url,
    cloudinaryPublicId,
  });

  // 4. Save the new banner to the database
  const savedBanner = await newBanner.save();

  // 5. Prepare and send the success response
  const bannerResponse = savedBanner.toObject();

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Banner image uploaded and saved successfully.",
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

  // 1. Fetch the existing banner to get its current cloudinaryPublicId for potential deletion
  const existingBanner = await Banner.findById(id);

  if (!existingBanner) {
    return next(new CustomError(404, "No banner found with that ID."));
  }

  // 2. Check if a new file is uploaded (for image update)
  if (req.file) {
    const folderName = "changan/banners";

    let url;
    let cloudinaryPublicId;

    try {
      const uploadResult = await imageUploadToCloudinary(
        req.file.buffer,
        folderName
      );
      url = uploadResult.url;
      cloudinaryPublicId = uploadResult.cloudinaryPublicId;

      if (!url || !cloudinaryPublicId) {
        return next(
          new CustomError(
            500,
            "Failed to get new image URL or Public ID from Cloudinary after upload."
          )
        );
      }
    } catch (uploadError) {
      console.error(
        "Error uploading new banner image to Cloudinary:",
        uploadError
      );
      return next(
        new CustomError(
          500,
          "Failed to upload new banner image. Please try again."
        )
      );
    }

    updateData.url = url;
    updateData.cloudinaryPublicId = cloudinaryPublicId;

    if (existingBanner.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(existingBanner.cloudinaryPublicId);
        console.log(
          `Old Cloudinary banner image ${existingBanner.cloudinaryPublicId} deleted.`
        );
      } catch (destroyError) {
        console.error(
          "Error deleting old banner image from Cloudinary:",
          destroyError.message || destroyError
        );
      }
    }
  }

  // 3. Update the banner in the database
  const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedBanner) {
    return next(
      new CustomError(404, "No banner found with that ID to update.")
    );
  }

  // 4. Prepare the response
  const bannerResponse = updatedBanner.toObject();

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

  // 1. Find the banner first to get its cloudinaryPublicId before deleting from DB
  const bannerToDelete = await Banner.findById(id);

  if (!bannerToDelete) {
    return next(new CustomError(404, "No banner found with that ID."));
  }

  // 2. Delete the image from Cloudinary using the stored public ID
  if (bannerToDelete.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(bannerToDelete.cloudinaryPublicId);
      console.log(
        `Cloudinary banner image ${bannerToDelete.cloudinaryPublicId} deleted successfully.`
      );
    } catch (destroyError) {
      console.error(
        "Error deleting banner image from Cloudinary (Option B):",
        destroyError.message || destroyError
      );
      return next(
        new CustomError(
          500,
          "Failed to delete banner image from Cloudinary. Banner not deleted from database."
        )
      );
    }
  }

  // 3. If Cloudinary deletion succeeded (or no image was linked), delete the banner from the database
  const deletedBanner = await Banner.findByIdAndDelete(id);

  if (!deletedBanner) {
    return next(
      new CustomError(404, "No banner found with that ID to delete.")
    );
  }

  // 4. Send success response
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner deleted successfully.",
  });
});
