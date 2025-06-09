import CSR from "../models/csr.model.js";
import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import { imageUploadToCloudinary } from "../utils/cloudinaryImageUpload.utils.js";
import cloudinary from "../configs/cloudinary.config.js";
import mongoose from "mongoose";

export const createCsrContent = asyncErrorHandler(async (req, res, next) => {
  const { category, title, eventDate, textBody } = req.body;

  // 1. Basic Input Validation
  if (!category || !title || !textBody) {
    return next(
      new CustomError(400, "Category, title, and text body are required.")
    );
  }
  const allowedCategories = ["Events", "Promotions", "News"];
  if (!allowedCategories.includes(category)) {
    return next(
      new CustomError(
        400,
        `Invalid category: '${category}'. Must be one of ${allowedCategories.join(
          ", "
        )}.`
      )
    );
  }
  if (category === "News" && eventDate) {
    return next(
      new CustomError(
        400,
        "Event Date should not be provided when category is 'News'."
      )
    );
  }

  // 2. Create new CSR document instance (without images initially)
  const newCsrDoc = new CSR({
    category,
    title,
    eventDate: eventDate || undefined, // Set to undefined if not provided or for 'News'
    textBody,
    // csrImages will be added after upload
  });

  // 3. Save the document FIRST to get its _id
  let savedCsrDoc = await newCsrDoc.save(); // Use 'let' to reassign if needed, though direct modification works too

  // 4. Handle Image Uploads to Cloudinary using the NEWLY GENERATED _id
  const csrImages = [];
  const folderName = `changan/csr_content/${category.toLowerCase()}/${
    savedCsrDoc._id
  }`; // <<< CRUCIAL CHANGE

  if (req.files && req.files.length > 0) {
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
          // If upload fails for one image, we need to decide to clean up previous uploads and created doc
          // For simplicity, we'll just return an error here, assuming front-end retries or specific cleanup
          // A more robust solution would involve rolling back (deleting images already uploaded for this doc)
          // or marking the doc as incomplete.
          return next(
            new CustomError(
              500,
              "Failed to get complete image URL or Public ID from Cloudinary after upload."
            )
          );
        }
        csrImages.push(uploadResult);
      } catch (uploadError) {
        console.error(
          `Error uploading CSR image (file: ${file.originalname}):`,
          uploadError
        );
        return next(
          new CustomError(
            500,
            `Failed to upload one or more images for CSR content. Please try again.`
          )
        );
      }
    }
  }

  // 5. Update the saved CSR document with the new images and updatedAt timestamp
  savedCsrDoc.csrImages = csrImages;
  savedCsrDoc.updatedAt = Date.now(); // Manually set updatedAt if not using timestamps:true

  const finalSavedCsrDoc = await savedCsrDoc.save(); // Save again to persist images and updated timestamp

  // 6. Prepare and Send Response
  const responseData = finalSavedCsrDoc.toObject();
  delete responseData.__v;

  res.status(201).json({
    code: 201,
    status: "success",
    message: "CSR content created successfully.",
    data: {
      csr: responseData,
    },
  });
});

export const getAllCsrContents = asyncErrorHandler(async (req, res, next) => {
  const { category } = req.query; // Get category from query parameters

  const filter = {}; // Initialize an empty filter object

  // If a category is provided in the query, add it to the filter
  if (category) {
    const allowedCategories = ["Events", "Promotions", "News"];
    if (!allowedCategories.includes(category)) {
      return next(
        new CustomError(
          400,
          `Invalid category: '${category}'. Must be one of ${allowedCategories.join(
            ", "
          )}.`
        )
      );
    }
    filter.category = category;
  }

  // Find CSR documents based on the filter, sort by creation date (newest first)
  const csrContents = await CSR.find(filter)
    .sort({ createdAt: -1 }) // Sort by createdAt in descending order (newest first)
    .select("-__v"); // Exclude the Mongoose version key

  if (!csrContents || csrContents.length === 0) {
    // Optionally return 404 if no content is found, or 200 with empty array
    // Returning 200 with an empty array is generally preferred for getAll
    return res.status(200).json({
      code: 200,
      status: "success",
      message: category
        ? `No CSR content found for category '${category}'.`
        : "No CSR content found.",
      data: {
        csrContents: [],
      },
    });
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: category
      ? `CSR content for category '${category}' retrieved successfully.`
      : "All CSR content retrieved successfully.",
    data: {
      count: csrContents.length,
      csrContents: csrContents,
    },
  });
});

export const getCsrContentById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params; // Get ID from URL parameters

  // 1. Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(
      new CustomError(400, `Invalid CSR content ID format: '${id}'.`)
    );
  }

  // 2. Find the CSR document by ID
  const csrContent = await CSR.findById(id).select("-__v"); // Exclude the Mongoose version key

  // 3. Handle not found scenario
  if (!csrContent) {
    return next(new CustomError(404, `CSR content with ID '${id}' not found.`));
  }

  // 4. Send success response
  res.status(200).json({
    code: 200,
    status: "success",
    message: `CSR content with ID '${id}' retrieved successfully.`,
    data: {
      csrContent: csrContent,
    },
  });
});

export const addImagesToCsrContent = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params; // Get CSR document ID from URL parameters

    // 1. Validate CSR document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new CustomError(400, `Invalid CSR content ID format: '${id}'.`)
      );
    }

    // 2. Find the existing CSR document
    const csrDoc = await CSR.findById(id);

    if (!csrDoc) {
      return next(
        new CustomError(404, `CSR content with ID '${id}' not found.`)
      );
    }

    // 3. Handle Image Uploads to Cloudinary
    const newCsrImages = []; // Array to store { url, cloudinaryPublicId } for new images
    // Construct folder name based on the existing CSR document's category
    const folderName = `changan/csr_content/${csrDoc.category.toLowerCase()}/${
      csrDoc._id
    }`;

    if (!req.files || req.files.length === 0) {
      return next(new CustomError(400, "No image files provided for upload."));
    }

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
        newCsrImages.push(uploadResult);
      } catch (uploadError) {
        console.error(
          `Error uploading new CSR image (file: ${file.originalname}):`,
          uploadError
        );
        return next(
          new CustomError(
            500,
            `Failed to upload one or more new images for CSR content. Please try again.`
          )
        );
      }
    }

    // 4. Push new images to the existing csrImages array and save
    csrDoc.csrImages.push(...newCsrImages); // Using spread operator to push all new images
    csrDoc.updatedAt = Date.now(); // Manually update updatedAt, or rely on timestamps:true if implemented
    const updatedCsrDoc = await csrDoc.save();

    // 5. Prepare and Send Response
    const responseData = updatedCsrDoc.toObject();
    delete responseData.__v;

    res.status(200).json({
      code: 200,
      status: "success",
      message: `${newCsrImages.length} new image(s) added successfully to CSR content with ID '${id}'.`,
      data: {
        csr: responseData,
      },
    });
  }
);

export const updateCsrTextContent = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { category, title, eventDate, textBody } = req.body;

    // 1. Validate CSR document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new CustomError(400, `Invalid CSR content ID format: '${id}'.`)
      );
    }

    // 2. Prepare update object
    const updateFields = {};
    if (category) updateFields.category = category;
    if (title) updateFields.title = title;
    if (textBody) updateFields.textBody = textBody;

    // Handle eventDate conditionally (if provided, set it; if explicitly null/undefined, remove it)
    // Ensure we don't accidentally set eventDate for 'News' category
    const csrDoc = await CSR.findById(id); // Find first to check category for validation
    if (!csrDoc) {
      return next(
        new CustomError(404, `CSR content with ID '${id}' not found.`)
      );
    }

    // Use the new category if provided, otherwise fallback to existing
    const currentOrNewCategory = category || csrDoc.category;

    if (currentOrNewCategory === "News") {
      if (eventDate !== undefined && eventDate !== null) {
        // If eventDate is attempted for News
        return next(
          new CustomError(
            400,
            "Event Date should not be provided when category is 'News'."
          )
        );
      }
      updateFields.eventDate = null; // Ensure eventDate is null for News category
    } else {
      // For Events/Promotions, if eventDate is provided, update it.
      // If eventDate is explicitly set to null, allow it. If not provided, don't change.
      if (eventDate !== undefined) {
        updateFields.eventDate = eventDate;
      }
    }

    // If category is updated, also update it in the updateFields
    if (category) {
      updateFields.category = category;
    }

    // Set updatedAt manually if not using `timestamps: true` schema option
    updateFields.updatedAt = Date.now();

    // 3. Find and update the document
    const updatedCsrDoc = await CSR.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { new: true, runValidators: true } // Return the updated doc, run schema validators
    ).select("-__v");

    if (!updatedCsrDoc) {
      return next(
        new CustomError(404, `CSR content with ID '${id}' not found.`)
      );
    }

    res.status(200).json({
      code: 200,
      status: "success",
      message: `CSR content with ID '${id}' updated successfully.`,
      data: {
        csr: updatedCsrDoc,
      },
    });
  }
);
export const replaceCsrImage = asyncErrorHandler(async (req, res, next) => {
  const { id: csrId, imageId } = req.params; // CSR doc ID and image subdocument ID

  // 1. Validate IDs
  if (!mongoose.Types.ObjectId.isValid(csrId)) {
    return next(
      new CustomError(400, `Invalid CSR content ID format: '${csrId}'.`)
    );
  }
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return next(new CustomError(400, `Invalid image ID format: '${imageId}'.`));
  }

  // 2. Find the CSR document
  const csrDoc = await CSR.findById(csrId);
  if (!csrDoc) {
    return next(
      new CustomError(404, `CSR content with ID '${csrId}' not found.`)
    );
  }

  // 3. Find the specific image subdocument to be replaced
  const oldImage = csrDoc.csrImages.id(imageId);
  if (!oldImage) {
    return next(
      new CustomError(
        404,
        `Image with ID '${imageId}' not found in CSR content '${csrId}'.`
      )
    );
  }

  // 4. Validate new image file
  if (!req.file) {
    // Assuming single file upload for replacement
    return next(
      new CustomError(400, "No new image file provided for replacement.")
    );
  }

  // 5. Delete OLD image from Cloudinary
  if (oldImage.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(oldImage.cloudinaryPublicId);
      console.log(
        `Old Cloudinary image deleted: ${oldImage.cloudinaryPublicId}`
      );
    } catch (cloudinaryError) {
      console.error(
        `Error deleting old Cloudinary image (${oldImage.cloudinaryPublicId}):`,
        cloudinaryError.message || cloudinaryError
      );
      // Decide if you want to abort if old image deletion fails.
      // For now, we'll log and proceed to upload the new one, as old one might be orphaned.
      // A more robust system might flag for manual cleanup or retry.
    }
  }

  // 6. Upload NEW image to Cloudinary
  let newImageUploadResult;
  try {
    const folderName = `changan/csr_content/${csrDoc.category.toLowerCase()}/${
      csrDoc._id
    }`;
    newImageUploadResult = await imageUploadToCloudinary(
      req.file.buffer,
      folderName
    );
    if (
      !newImageUploadResult ||
      !newImageUploadResult.url ||
      !newImageUploadResult.cloudinaryPublicId
    ) {
      return next(
        new CustomError(
          500,
          "Failed to get complete new image URL or Public ID from Cloudinary."
        )
      );
    }
  } catch (uploadError) {
    console.error(`Error uploading new CSR image:`, uploadError);
    return next(
      new CustomError(500, `Failed to upload new image. Please try again.`)
    );
  }

  // 7. Update the existing image subdocument with new details
  oldImage.url = newImageUploadResult.url;
  oldImage.cloudinaryPublicId = newImageUploadResult.cloudinaryPublicId;

  // Set updatedAt manually if not using `timestamps: true` schema option
  csrDoc.updatedAt = Date.now();

  // 8. Save the parent document to persist changes to the subdocument
  const updatedCsrDoc = await csrDoc.save();

  // 9. Prepare and Send Response
  const responseData = updatedCsrDoc.toObject();
  delete responseData.__v;

  res.status(200).json({
    code: 200,
    status: "success",
    message: `Image with ID '${imageId}' replaced successfully for CSR content '${csrId}'.`,
    data: {
      csr: responseData,
    },
  });
});

export const deleteCsrDocument = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params; // Get CSR document ID from URL parameters

  // 1. Validate CSR document ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(
      new CustomError(400, `Invalid CSR content ID format: '${id}'.`)
    );
  }

  // 2. Find the CSR document (to get its category and confirm existence for folder path)
  const csrDoc = await CSR.findById(id);

  if (!csrDoc) {
    return next(new CustomError(404, `CSR content with ID '${id}' not found.`));
  }

  // 3. Define the Cloudinary folder prefix that is UNIQUE to this CSR document
  // This assumes your image uploads are now structured like:
  // `changan/csr_content/:category.toLowerCase()/:csrDoc._id/`
  const folderPrefix = `changan/csr_content/${csrDoc.category.toLowerCase()}/${
    csrDoc._id
  }`;

  // 4. Delete all associated images from Cloudinary by deleting their unique folder prefix
  // This step is crucial before deleting the DB record to maintain consistency.
  try {
    // cloudinary.api.delete_resources_by_prefix can take a folder prefix
    const apiResult = await cloudinary.api.delete_resources_by_prefix(
      folderPrefix
    );
    console.log(
      `Cloudinary folder deletion for CSR ID '${id}' (folder: ${folderPrefix}):`,
      apiResult
    );

    // If Cloudinary reports partial success (e.g., some resources couldn't be found/deleted)
    // You might decide whether to abort or proceed based on your error tolerance.
    // For critical consistency, if not all are 'ok', you might still throw.
    if (apiResult && apiResult.partial_success === true) {
      console.warn(
        `Partial success in deleting images from Cloudinary folder '${folderPrefix}'. Some images might remain. Result:`,
        apiResult
      );
      // Depending on severity, you might return next(new CustomError(500, ...)) here
      // For now, we'll proceed if there was at least some success, but warn.
    }
  } catch (cloudinaryError) {
    console.error(
      `CRITICAL ERROR: Failed to delete Cloudinary folder '${folderPrefix}' for CSR ID '${id}':`,
      cloudinaryError.message || cloudinaryError
    );
    // If Cloudinary deletion fails, abort the entire operation to maintain consistency.
    return next(
      new CustomError(
        500,
        `Failed to delete associated images folder from Cloudinary for CSR ID '${id}'. Document deletion aborted.`
      )
    );
  }

  // 5. Only proceed with MongoDB document deletion if Cloudinary deletion was successful
  const deletedDoc = await CSR.findByIdAndDelete(id);

  if (!deletedDoc) {
    // This case should ideally not be hit if `csrDoc` was found earlier,
    // but handles a rare race condition or an unexpected DB issue.
    console.error(
      `Error: CSR content for ID '${id}' disappeared from DB after Cloudinary deletion.`
    );
    return next(
      new CustomError(
        500,
        `CSR content with ID '${id}' could not be deleted from the database.`
      )
    );
  }

  // 6. Send success response (204 No Content is standard for successful DELETE operations)
  res.status(200).json({
    code: 200,
    status: "success",
    message: `CSR content with ID '${id}' deleted successfully.`,
    data: {
      csr: deletedDoc,
    },
  });
});

export const deleteCsrImage = asyncErrorHandler(async (req, res, next) => {
  const { id: csrId, imageId } = req.params; // Get parent CSR document ID and image subdocument ID

  // 1. Validate IDs
  if (!mongoose.Types.ObjectId.isValid(csrId)) {
    return next(
      new CustomError(400, `Invalid CSR content ID format: '${csrId}'.`)
    );
  }
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return next(new CustomError(400, `Invalid image ID format: '${imageId}'.`));
  }

  // 2. Find the parent CSR document
  const csrDoc = await CSR.findById(csrId);
  if (!csrDoc) {
    return next(
      new CustomError(404, `CSR content with ID '${csrId}' not found.`)
    );
  }

  // 3. Find the specific image subdocument to be deleted within the csrImages array
  const imageToDelete = csrDoc.csrImages.id(imageId);
  if (!imageToDelete) {
    return next(
      new CustomError(
        404,
        `Image with ID '${imageId}' not found in CSR content '${csrId}'.`
      )
    );
  }

  // 4. Delete the image from Cloudinary using its public ID
  // This is for individual images, so use uploader.destroy
  if (imageToDelete.cloudinaryPublicId) {
    try {
      const destroyResult = await cloudinary.uploader.destroy(
        imageToDelete.cloudinaryPublicId
      );
      console.log(
        `Cloudinary individual image deletion result for ${imageToDelete.cloudinaryPublicId}:`,
        destroyResult
      );

      // Cloudinary's destroy can return 'not found' if the image was already gone, which is acceptable.
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
            `Failed to delete image from Cloudinary. Database update aborted to maintain consistency.`
          )
        );
      }
    } catch (cloudinaryError) {
      console.error(
        `Critical Error: Failed to delete image ${imageToDelete.cloudinaryPublicId} from Cloudinary:`,
        cloudinaryError.message || cloudinaryError
      );
      // If Cloudinary deletion fails, prevent DB update to avoid orphaned DB entries
      return next(
        new CustomError(
          500,
          `Failed to delete image from Cloudinary. Database update aborted to maintain consistency.`
        )
      );
    }
  } else {
    // If for some reason the image subdocument has no publicId but exists in DB
    console.warn(
      `Image with ID '${imageId}' has no cloudinaryPublicId. Proceeding with DB deletion only.`
    );
  }

  // 5. Remove the image subdocument from the array in MongoDB
  const updatedCsrDoc = await CSR.findOneAndUpdate(
    { _id: csrId },
    {
      $pull: { csrImages: { _id: imageId } }, // Pull the specific subdocument by its _id
      $set: { updatedAt: Date.now() }, // Update the parent document's timestamp
    },
    { new: true, runValidators: true } // Return the updated document, run schema validators
  ).select("-__v"); // Exclude the Mongoose version key from the response

  if (!updatedCsrDoc) {
    // This could happen if the parent document was deleted concurrently
    return next(
      new CustomError(
        404,
        `CSR content with ID '${csrId}' not found after image deletion attempt.`
      )
    );
  }

  // 6. Send success response
  res.status(200).json({
    code: 200,
    status: "success",
    message: `Image with ID '${imageId}' deleted successfully from CSR content '${csrId}'.`,
    data: {
      csr: updatedCsrDoc,
    },
  });
});
