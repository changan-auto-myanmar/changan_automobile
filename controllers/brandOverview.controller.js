import BrandOverview from "../models/brandOverview.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import { imageUploadToCloudinary } from "../utils/cloudinaryImageUpload.utils.js";
import cloudinary from "../configs/cloudinary.config.js";
import mongoose from "mongoose";

export const createBrandOverview = asyncErrorHandler(async (req, res, next) => {
  const { car_brand } = req.body;
  const brandUpperCase = car_brand ? car_brand.toUpperCase() : null;

  // 1. Input Validation for car_brand
  if (!brandUpperCase) {
    return next(
      new CustomError(
        400,
        "Car brand is required to create or update a brand overview."
      )
    );
  }

  const allowedBrands = ["CHANGAN", "DEEPAL", "KAICHENG"];
  if (!allowedBrands.includes(brandUpperCase)) {
    return next(
      new CustomError(
        400,
        `Invalid car brand: '${car_brand}'. Must be one of ${allowedBrands.join(
          ", "
        )}.`
      )
    );
  }

  // 2. Check for image files from Multer
  if (!req.files || req.files.length === 0) {
    return next(
      new CustomError(
        400,
        "At least one image file is required for the brand overview."
      )
    );
  }

  // 3. Upload New Images to Cloudinary
  const newImageUploadResults = [];
  const folderName = `changan/brand_overviews/${brandUpperCase}`;

  for (const file of req.files) {
    try {
      const uploadResult = await imageUploadToCloudinary(
        file.buffer,
        folderName
      );

      if (
        !uploadResult ||
        !uploadResult.url ||
        !uploadResult.cloudinaryPublicId
      ) {
        return next(
          new CustomError(
            500,
            "Failed to get complete image URL or Public ID from Cloudinary after upload."
          )
        );
      }
      newImageUploadResults.push(uploadResult);
    } catch (uploadError) {
      return next(
        new CustomError(
          500,
          `Failed to upload one or more images for ${brandUpperCase}. Please try again.`
        )
      );
    }
  }

  // 4. Find or Create/Update Brand Overview Document
  let brandOverviewDoc;
  let message;
  let statusCode;

  const existingBrandOverview = await BrandOverview.findOne({
    car_brand: brandUpperCase,
  });

  if (existingBrandOverview) {
    existingBrandOverview.brandImageUrls.push(...newImageUploadResults);
    brandOverviewDoc = await existingBrandOverview.save();
    message = `New images added to existing brand overview for '${car_brand}'.`;
    statusCode = 200;
  } else {
    const newBrandOverview = new BrandOverview({
      car_brand: brandUpperCase,
      brandImageUrls: newImageUploadResults,
    });
    brandOverviewDoc = await newBrandOverview.save();
    message = `Brand overview created successfully for '${car_brand}'.`;
    statusCode = 201;
  }

  // 5. Prepare and send the response
  const brandOverviewResponse = brandOverviewDoc.toObject();

  res.status(201).json({
    code: statusCode,
    status: "success",
    message: message,
    data: {
      brandOverview: brandOverviewResponse,
    },
  });
});

export const getAllbrandOverview = asyncErrorHandler(async (req, res, next) => {
  const brandOverview = await BrandOverview.find({}).lean();
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Car brand overview data retrived successfully.",
    data: {
      brandOverview,
    },
  });
});

export const getBrandOverviewByCarBrand = asyncErrorHandler(
  async (req, res, next) => {
    const { car_brand } = req.params; // Get car_brand from URL parameters

    // 1. Input Validation for car_brand
    if (!car_brand) {
      return next(
        new CustomError(
          400,
          "Car brand is required to retrieve a brand overview."
        )
      );
    }

    const brandUpperCase = car_brand.toUpperCase(); // Normalize brand name
    const allowedBrands = ["CHANGAN", "DEEPAL", "KAICHENG"];
    if (!allowedBrands.includes(brandUpperCase)) {
      return next(
        new CustomError(
          400,
          `Invalid car brand: '${car_brand}'. Must be one of ${allowedBrands.join(
            ", "
          )}.`
        )
      );
    }

    // 2. Find the Brand Overview document by car_brand
    const brandOverviewDoc = await BrandOverview.findOne({
      car_brand: brandUpperCase,
    });

    // 3. Handle not found scenario
    if (!brandOverviewDoc) {
      return next(
        new CustomError(404, `Brand overview for '${car_brand}' not found.`)
      );
    }

    // 4. Prepare and send the response
    const brandOverviewResponse = brandOverviewDoc.toObject();
    delete brandOverviewResponse.__v; // Remove Mongoose's version key

    res.status(200).json({
      code: 200,
      status: "success",
      message: `Brand overview for '${car_brand}' retrieved successfully.`,
      data: {
        brandOverview: brandOverviewResponse,
      },
    });
  }
);

export const updateBrandOverview = asyncErrorHandler(async (req, res, next) => {
  const { car_brand } = req.params; // Get car_brand from URL parameters
  const { imageId } = req.body; // Get the _id of the image subdocument to update from the request body

  // 1. Input Validation
  if (!car_brand) {
    return next(
      new CustomError(
        400,
        "Car brand is required in parameters to update a brand overview."
      )
    );
  }
  if (!imageId) {
    return next(
      new CustomError(
        400,
        "Image ID is required in the request body to update a specific image."
      )
    );
  }
  if (!req.file) {
    return next(
      new CustomError(
        400,
        "A new image file is required to update an existing image."
      )
    );
  }

  const brandUpperCase = car_brand.toUpperCase(); // Normalize brand name
  const allowedBrands = ["CHANGAN", "DEEPAL", "KAICHENG"];
  if (!allowedBrands.includes(brandUpperCase)) {
    return next(
      new CustomError(
        400,
        `Invalid car brand: '${car_brand}'. Must be one of ${allowedBrands.join(
          ", "
        )}.`
      )
    );
  }

  // 2. Find the Brand Overview document
  const brandOverviewDoc = await BrandOverview.findOne({
    car_brand: brandUpperCase,
  });

  if (!brandOverviewDoc) {
    return next(
      new CustomError(404, `Brand overview for '${car_brand}' not found.`)
    );
  }

  // 3. Find the specific image subdocument to be updated
  const oldImageSubdocument = brandOverviewDoc.brandImageUrls.id(imageId);

  if (!oldImageSubdocument) {
    return next(
      new CustomError(
        404,
        `Image with ID '${imageId}' not found in '${car_brand}' brand overview.`
      )
    );
  }

  // 4. Upload the New Image to Cloudinary
  const folderName = `changan/brand_overviews/${brandUpperCase}`;
  let newImageUrl;
  let newPublicId;

  try {
    const uploadResult = await imageUploadToCloudinary(
      req.file.buffer,
      folderName
    );
    newImageUrl = uploadResult.url;
    newPublicId = uploadResult.cloudinaryPublicId;

    if (!newImageUrl || !newPublicId) {
      return next(
        new CustomError(
          500,
          "Failed to get complete image URL or Public ID from Cloudinary after new upload."
        )
      );
    }
  } catch (uploadError) {
    console.error(
      "Error uploading new brand overview image to Cloudinary:",
      uploadError
    );
    return next(
      new CustomError(
        500,
        `Failed to upload new image for '${car_brand}'. Please try again.`
      )
    );
  }

  // 5. Delete the Old Image from Cloudinary
  if (oldImageSubdocument.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(oldImageSubdocument.cloudinaryPublicId);
      console.log(
        `Old Cloudinary image ${oldImageSubdocument.cloudinaryPublicId} deleted.`
      );
    } catch (destroyError) {
      // Log the error but don't prevent the DB update.
      // We prioritize updating the new image in DB over failing if old image deletion fails.
      console.error(
        "Error deleting old brand overview image from Cloudinary:",
        destroyError.message || destroyError
      );
    }
  }

  // 6. Update the specific subdocument in the array
  oldImageSubdocument.set({
    // Use .set() to update the subdocument
    url: newImageUrl,
    cloudinaryPublicId: newPublicId,
  });

  // 7. Save the parent BrandOverview document to persist subdocument changes
  const updatedBrandOverviewDoc = await brandOverviewDoc.save();

  // 8. Prepare and send the response
  const brandOverviewResponse = updatedBrandOverviewDoc.toObject();
  delete brandOverviewResponse.__v;

  res.status(200).json({
    code: 200,
    status: "success",
    message: `Image with ID '${imageId}' for '${car_brand}' updated successfully.`,
    data: {
      brandOverview: brandOverviewResponse,
    },
  });
});

export const addImagesToBrandOverview = asyncErrorHandler(
  async (req, res, next) => {
    const { car_brand } = req.params; // Get car_brand from URL parameters

    // 1. Input Validation for car_brand
    if (!car_brand) {
      return next(
        new CustomError(
          400,
          "Car brand is required in parameters to add images."
        )
      );
    }

    const brandUpperCase = car_brand.toUpperCase(); // Normalize brand name
    const allowedBrands = ["CHANGAN", "DEEPAL", "KAICHENG"];
    if (!allowedBrands.includes(brandUpperCase)) {
      return next(
        new CustomError(
          400,
          `Invalid car brand: '${car_brand}'. Must be one of ${allowedBrands.join(
            ", "
          )}.`
        )
      );
    }

    // 2. Check for new image files from Multer
    if (!req.files || req.files.length === 0) {
      return next(new CustomError(400, "No new images provided to add."));
    }

    // Removed check for MAX_IMAGES_PER_UPLOAD

    // 3. Find the existing Brand Overview document
    const existingBrandOverview = await BrandOverview.findOne({
      car_brand: brandUpperCase,
    });

    if (!existingBrandOverview) {
      return next(
        new CustomError(
          404,
          `Brand overview for '${car_brand}' not found. Cannot add images.`
        )
      );
    }

    // 4. Upload New Images to Cloudinary
    const newImageUploadResults = []; // Will store { url, cloudinaryPublicId } objects
    const folderName = `changan/brand_overviews/${brandUpperCase}`;

    for (const file of req.files) {
      try {
        const uploadResult = await imageUploadToCloudinary(
          file.buffer,
          folderName
        );

        if (
          !uploadResult ||
          !uploadResult.url ||
          !uploadResult.cloudinaryPublicId
        ) {
          return next(
            new CustomError(
              500,
              "Failed to get complete image URL or Public ID from Cloudinary after upload."
            )
          );
        }
        newImageUploadResults.push(uploadResult);
      } catch (uploadError) {
        console.error(
          `Error uploading new image for ${brandUpperCase} (file: ${file.originalname}):`,
          uploadError
        );
        return next(
          new CustomError(
            500,
            `Failed to upload one or more new images for '${car_brand}'. Please try again.`
          )
        );
      }
    }

    // 5. Add the new images to the existing brandOverviewDoc's brandImageUrls array
    existingBrandOverview.brandImageUrls.push(...newImageUploadResults);

    // 6. Save the updated Brand Overview document
    const updatedBrandOverviewDoc = await existingBrandOverview.save();

    // 7. Prepare and send the response
    const brandOverviewResponse = updatedBrandOverviewDoc.toObject();

    res.status(200).json({
      code: 200,
      status: "success",
      message: "New images added successfully.",
      data: {
        count: brandOverviewResponse.brandImageUrls.length, // Total count of images now
        brandOverview: brandOverviewResponse, // The entire updated document
      },
    });
  }
);

export const deleteBrandOverview = asyncErrorHandler(async (req, res, next) => {
  const { car_brand } = req.params;

  // 1. Input Validation
  if (!car_brand) {
    return next(
      new CustomError(400, "Car brand is required to delete a brand overview.")
    );
  }

  const brandUpperCase = car_brand.toUpperCase();
  const allowedBrands = ["CHANGAN", "DEEPAL", "KAICHENG"];
  if (!allowedBrands.includes(brandUpperCase)) {
    return next(
      new CustomError(
        400,
        `Invalid car brand: '${car_brand}'. Must be one of ${allowedBrands.join(
          ", "
        )}.`
      )
    );
  }

  // 2. Find the Brand Overview document (to confirm existence before deletion)
  const brandOverviewDoc = await BrandOverview.findOne({
    car_brand: brandUpperCase,
  });

  if (!brandOverviewDoc) {
    return next(
      new CustomError(404, `Brand overview for '${car_brand}' not found.`)
    );
  }

  // 3. Define the Cloudinary folder prefix to delete
  // This should match how you originally store images in folders.
  const folderPrefix = `changan/brand_overviews/${brandUpperCase}`;

  // 4. Delete all associated images from Cloudinary using folder prefix
  try {
    // Use cloudinary.api.delete_resources_by_prefix to delete all assets in the folder
    const apiResult = await cloudinary.api.delete_resources_by_prefix(
      folderPrefix
    );
    console.log(
      `Cloudinary deletion by prefix for folder '${folderPrefix}':`,
      apiResult
    );

    // Check Cloudinary's response for specific errors if needed
    // For example, apiResult.deleted might list resources that were deleted.
    // If apiResult.partial_success is true, it means some failed.
    if (apiResult && apiResult.partial_success === true) {
      console.warn(
        `Partial success in deleting images from Cloudinary folder '${folderPrefix}'.`
      );
      // You might want to log apiResult.failed_public_ids if available.
    }
  } catch (cloudinaryError) {
    console.error(
      `CRITICAL ERROR: Failed to delete Cloudinary folder '${folderPrefix}' for '${car_brand}':`,
      cloudinaryError.message || cloudinaryError
    );
    // If Cloudinary deletion fails, abort the entire operation to maintain consistency.
    return next(
      new CustomError(
        500,
        `Failed to delete associated images folder from Cloudinary for '${car_brand}'. Document deletion aborted.`
      )
    );
  }

  // 5. Proceed with MongoDB deletion only if Cloudinary deletion was successful
  const deletedDoc = await BrandOverview.findOneAndDelete({
    car_brand: brandUpperCase,
  });

  if (!deletedDoc) {
    console.error(
      `Error: Brand overview for '${car_brand}' disappeared from DB after Cloudinary deletion.`
    );
    return next(
      new CustomError(
        500,
        `Brand overview for '${car_brand}' could not be deleted from the database.`
      )
    );
  }

  // 6. Send success response
  res.status(200).json({
    code: 200,
    status: "success",
    message: `Brand overview for '${car_brand}' and its images deleted successfully.`,
  });
});

export const deleteImagesFromBrandOverview = asyncErrorHandler(
  async (req, res, next) => {
    const { car_brand } = req.params; // car_brand still from URL params
    const { imageId } = req.body; // <<< imageId now from request body

    // 1. Input Validation
    if (!car_brand) {
      return next(
        new CustomError(
          400,
          "Car brand is required in parameters to delete an image."
        )
      );
    }
    if (!imageId) {
      // Now checking req.body.imageId
      return next(
        new CustomError(
          400,
          "Image ID is required in the request body to delete a specific image."
        )
      );
    }

    // Validate imageId format
    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return next(
        new CustomError(400, `Invalid image ID format: '${imageId}'.`)
      );
    }

    const brandUpperCase = car_brand.toUpperCase();
    const allowedBrands = ["CHANGAN", "DEEPAL", "KAICHENG"];
    if (!allowedBrands.includes(brandUpperCase)) {
      return next(
        new CustomError(
          400,
          `Invalid car brand: '${car_brand}'. Must be one of ${allowedBrands.join(
            ", "
          )}.`
        )
      );
    }

    // 2. Find the Brand Overview document
    const brandOverviewDoc = await BrandOverview.findOne({
      car_brand: brandUpperCase,
    });

    if (!brandOverviewDoc) {
      return next(
        new CustomError(404, `Brand overview for '${car_brand}' not found.`)
      );
    }

    // 3. Find the specific image subdocument to be deleted
    const imageToDelete = brandOverviewDoc.brandImageUrls.id(imageId);

    if (!imageToDelete) {
      return next(
        new CustomError(
          404,
          `Image with ID '${imageId}' not found in '${car_brand}' brand overview.`
        )
      );
    }

    // 4. Delete the image from Cloudinary
    if (imageToDelete.cloudinaryPublicId) {
      try {
        const destroyResult = await cloudinary.uploader.destroy(
          imageToDelete.cloudinaryPublicId
        );
        console.log(
          `Cloudinary deletion result for ${imageToDelete.cloudinaryPublicId}:`,
          destroyResult
        );

        if (
          destroyResult.result !== "ok" &&
          destroyResult.result !== "not found"
        ) {
          console.warn(
            `Cloudinary deletion for ${imageToDelete.cloudinaryPublicId} returned unexpected result:`,
            destroyResult
          );
          return next(
            new CustomError(
              500,
              `Failed to delete image from Cloudinary for '${car_brand}'. Database update aborted to maintain consistency.`
            )
          );
        }
      } catch (cloudinaryError) {
        console.error(
          `Critical Error: Failed to delete image from Cloudinary for '${car_brand}':`,
          cloudinaryError.message || cloudinaryError
        );
        return next(
          new CustomError(
            500,
            `Failed to delete image from Cloudinary for '${car_brand}'. Database update aborted to maintain consistency.`
          )
        );
      }
    } else {
      console.warn(
        `Image with ID '${imageId}' has no cloudinaryPublicId. Proceeding with DB deletion only.`
      );
    }

    // 5. Remove the image from MongoDB array using $pull
    const updatedDoc = await BrandOverview.findOneAndUpdate(
      { car_brand: brandUpperCase },
      { $pull: { brandImageUrls: { _id: imageId } } }, // $pull by single _id
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      return next(
        new CustomError(
          500,
          `Failed to update Brand overview for '${car_brand}' in database after Cloudinary deletion.`
        )
      );
    }

    // 6. Send success response
    const brandOverviewResponse = updatedDoc.toObject();
    delete brandOverviewResponse.__v;

    res.status(200).json({
      code: 200,
      status: "success",
      message: `Image with ID '${imageId}' deleted successfully from '${car_brand}'.`,
      data: {
        count: brandOverviewResponse.brandImageUrls.length,
        brandOverview: brandOverviewResponse,
      },
    });
  }
);
