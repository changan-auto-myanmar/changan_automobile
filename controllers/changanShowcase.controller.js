import ChanganShowcase from "../models/changanShowcase.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import mongoose from "mongoose";
import { imageUploadToCloudinary } from "../utils/cloudinaryImageUpload.utils.js";
import cloudinary from "../configs/cloudinary.config.js";

export const createChanganShowcase = asyncErrorHandler(
  async (req, res, next) => {
    const {
      car_brand,
      car_name,
      car_slogan,
      color_names, // JSON string from frontend for CarColorSchema
    } = req.body;

    // 1. Basic Input Validation for required text fields
    if (!car_brand || !car_name) {
      return next(new CustomError(400, "Car brand and car name are required."));
    }
    const allowedBrands = ["CHANGAN", "DEEPAL", "KAICHENG"];
    if (!allowedBrands.includes(car_brand)) {
      return next(
        new CustomError(
          400,
          `Invalid car brand: '${car_brand}'. Must be one of ${allowedBrands.join(
            ", "
          )}.`
        )
      );
    }

    const uploadedFiles = req.files;

    // 2. Create new ChanganShowcase document instance (without image URLs initially)
    const newShowcaseDoc = new ChanganShowcase({
      car_brand,
      car_name,
      car_slogan: car_slogan || undefined,
    });

    // 3. Save the document FIRST to get its _id for unique Cloudinary folder paths
    let savedShowcaseDoc = await newShowcaseDoc.save();

    const showcaseId = savedShowcaseDoc._id;
    const baseFolderName = `changan/showcase/${car_brand.toLowerCase()}/${showcaseId}`;

    // Helper function to upload a single file to Cloudinary and return FileUploadSchema data
    const uploadAndGetFileData = async (file, subFolder = "") => {
      if (!file) return null;

      const folder = subFolder
        ? `${baseFolderName}/${subFolder}`
        : baseFolderName;
      const result = await imageUploadToCloudinary(file.buffer, folder); // Make sure this utility handles resource_type for PDFs/Videos

      if (!result || !result.url || !result.cloudinaryPublicId) {
        throw new CustomError(
          500,
          `Failed to get complete upload data from Cloudinary for file: ${file.originalname}.`
        );
      }
      return { url: result.url, cloudinaryPublicId: result.cloudinaryPublicId };
    };

    // 4. Handle Single Required Image Fields (mockup, car_banner)
    const mockupFile = uploadedFiles.mockup && uploadedFiles.mockup[0];
    const carBannerFile =
      uploadedFiles.car_banner && uploadedFiles.car_banner[0];

    if (!mockupFile)
      return next(new CustomError(400, "Mockup image file is required."));
    if (!carBannerFile)
      return next(new CustomError(400, "Car banner image file is required."));

    savedShowcaseDoc.mockup = await uploadAndGetFileData(mockupFile, "mockup");
    savedShowcaseDoc.car_banner = await uploadAndGetFileData(
      carBannerFile,
      "banner"
    );

    // Handle Optional Single File Field (car_brochure)
    // Renamed from 'car_porche' and now it's optional based on the schema
    const carBrochureFile =
      uploadedFiles.car_brochure && uploadedFiles.car_brochure[0];
    if (carBrochureFile) {
      // Only upload if file is provided
      savedShowcaseDoc.car_brochure = await uploadAndGetFileData(
        carBrochureFile,
        "brochure"
      );
      // IMPORTANT: If 'car_brochure' can be a PDF, your `imageUploadToCloudinary` utility
      // must handle `resource_type: 'raw'` for PDFs.
      // Example: imageUploadToCloudinary(file.buffer, folder, { resource_type: 'raw' });
    }

    // 5. Handle Optional Array Image Fields (car_exterior, car_interior, gallery)
    savedShowcaseDoc.car_exterior = [];
    if (uploadedFiles.car_exterior && uploadedFiles.car_exterior.length > 0) {
      for (const file of uploadedFiles.car_exterior) {
        savedShowcaseDoc.car_exterior.push(
          await uploadAndGetFileData(file, "exterior")
        );
      }
    }

    savedShowcaseDoc.car_interior = [];
    if (uploadedFiles.car_interior && uploadedFiles.car_interior.length > 0) {
      for (const file of uploadedFiles.car_interior) {
        savedShowcaseDoc.car_interior.push(
          await uploadAndGetFileData(file, "interior")
        );
      }
    }

    savedShowcaseDoc.gallery = [];
    if (uploadedFiles.gallery && uploadedFiles.gallery.length > 0) {
      for (const file of uploadedFiles.gallery) {
        savedShowcaseDoc.gallery.push(
          await uploadAndGetFileData(file, "gallery")
        );
      }
    }

    // 6. Handle Car Colors (Aligned with CarColorSchema's car_color_swatches field)
    savedShowcaseDoc.car_color = [];

    const rawColorNamesJson = req.body.color_names;
    const carColorImageFiles = uploadedFiles.car_color_images || [];
    const carColorSwatchFiles = uploadedFiles.car_color_swatches || []; // Renamed field in schema

    if (
      rawColorNamesJson ||
      carColorImageFiles.length > 0 ||
      carColorSwatchFiles.length > 0
    ) {
      let parsedColorNames;
      try {
        if (!rawColorNamesJson) {
          throw new Error(
            "Color names (color_names) must be provided as a JSON array string if car color images or swatches are present."
          );
        }
        parsedColorNames = JSON.parse(rawColorNamesJson);
        if (!Array.isArray(parsedColorNames)) {
          throw new Error("color_names must be a valid JSON array.");
        }
      } catch (error) {
        return next(
          new CustomError(400, `Invalid color_names data: ${error.message}`)
        );
      }

      const numberOfColorOptions = parsedColorNames.length;

      if (
        numberOfColorOptions !== carColorImageFiles.length ||
        numberOfColorOptions !== carColorSwatchFiles.length
      ) {
        return next(
          new CustomError(
            400,
            `Mismatched counts for car color options. Expected ${numberOfColorOptions} entries, but received ${carColorImageFiles.length} car images and ${carColorSwatchFiles.length} color swatches. All three must match in count.`
          )
        );
      }

      for (let i = 0; i < numberOfColorOptions; i++) {
        const colorName = parsedColorNames[i];
        const imageFileForCurrentColor = carColorImageFiles[i];
        const swatchFileForCurrentColor = carColorSwatchFiles[i];

        if (!colorName) {
          return next(
            new CustomError(
              400,
              `Color name is missing for car color option at index ${i}.`
            )
          );
        }
        if (!imageFileForCurrentColor) {
          return next(
            new CustomError(
              400,
              `Car image file is missing for color '${colorName}' (index ${i}).`
            )
          );
        }
        if (!swatchFileForCurrentColor) {
          return next(
            new CustomError(
              400,
              `Color swatch file is missing for color '${colorName}' (index ${i}).`
            )
          );
        }

        const uploadedCarImage = await uploadAndGetFileData(
          imageFileForCurrentColor,
          `colors/${colorName.replace(/\s+/g, "_").toLowerCase()}/car_image`
        );
        const uploadedColorSwatch = await uploadAndGetFileData(
          swatchFileForCurrentColor,
          `colors/${colorName.replace(/\s+/g, "_").toLowerCase()}/swatch`
        );

        // CRITICAL ALIGNMENT: Match the field name in CarColorSchema
        savedShowcaseDoc.car_color.push({
          car_color_image: uploadedCarImage,
          car_color_swatches: uploadedColorSwatch,
          color_name: colorName,
        });
      }
    }

    // 7. Set updatedAt timestamp
    savedShowcaseDoc.updatedAt = Date.now();

    // 8. Save the document AGAIN to persist all uploaded image details and arrays
    const finalSavedShowcaseDoc = await savedShowcaseDoc.save();

    // 9. Prepare and Send Response
    const responseData = finalSavedShowcaseDoc.toObject();
    delete responseData.__v;

    res.status(201).json({
      code: 201,
      status: "success",
      message: "Changan Showcase content created successfully.",
      data: {
        changanShowcase: responseData,
      },
    });
  }
);

export const getAllShowcases = asyncErrorHandler(async (req, res, next) => {
  const showcases = await ChanganShowcase.find({}).lean();

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Showcases retrieved successfully.",
    data: { showcases },
  });
});

export const getShowcaseById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const showcase = await ChanganShowcase.findById(id).lean();

  if (!showcase) {
    return next(new CustomError(404, "Showcase not found."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Showcase retrieved successfully.",
    data: { showcase },
  });
});

export const deleteShowcase = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const showcase = await changanShowcase.findById(id);

  if (!showcase) {
    return next(new CustomError(404, "Showcase not found."));
  }

  const filesToDelete = [];

  if (showcase.mockup) filesToDelete.push(showcase.mockup.filepath);
  if (showcase.car_banner) filesToDelete.push(showcase.car_banner.filepath);
  if (showcase.car_porche) filesToDelete.push(showcase.car_porche.filepath);

  showcase.car_exterior.forEach((file) => filesToDelete.push(file.filepath));
  showcase.car_interior.forEach((file) => filesToDelete.push(file.filepath));
  showcase.gallery.forEach((file) => filesToDelete.push(file.filepath));

  showcase.car_color.forEach((color) => {
    if (color.car_image) filesToDelete.push(color.car_image.filepath);
    if (color.car_color) filesToDelete.push(color.car_color.filepath);
  });

  for (const filePath of filesToDelete) {
    try {
      await fs.unlink(path.resolve(filePath));
    } catch (err) {
      console.error(
        `Failed to delete file: ${filePath}. Error: ${err.message}`
      );
    }
  }

  await changanShowcase.findByIdAndDelete(id);

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Showcase and associated files deleted successfully.",
  });
});

export const updateShowcaseMainText = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params; // ID of the ChanganShowcase document
    const { car_brand, car_name, car_slogan } = req.body; // Text fields to update

    // 1. Validate ChanganShowcase ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid Changan Showcase ID."));
    }

    const showcaseDoc = await ChanganShowcase.findById(id);

    if (!showcaseDoc) {
      return next(new CustomError(404, "Changan Showcase document not found."));
    }

    // 2. Update provided fields
    if (car_brand !== undefined) {
      const allowedBrands = ["CHANGAN", "DEEPAL", "KAICHENG"];
      if (!allowedBrands.includes(car_brand)) {
        return next(
          new CustomError(
            400,
            `Invalid car brand: '${car_brand}'. Must be one of ${allowedBrands.join(
              ", "
            )}.`
          )
        );
      }
      showcaseDoc.car_brand = car_brand;
    }
    if (car_name !== undefined) {
      showcaseDoc.car_name = car_name;
    }
    if (car_slogan !== undefined) {
      showcaseDoc.car_slogan = car_slogan;
    }

    // 3. Save the updated document
    showcaseDoc.updatedAt = Date.now(); // Manually update timestamp
    await showcaseDoc.save();

    res.status(200).json({
      code: 200,
      status: "success",
      message: "Main showcase text fields updated successfully.",
      data: {
        changanShowcase: showcaseDoc.toObject(),
      },
    });
  }
);

export const updateShowcaseSingleTopLevelImage = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params; // Showcase ID is still in params
    const uploadedFiles = req.files; // Multer's .fields() puts files here

    // 1. Validate ChanganShowcase ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid Changan Showcase ID."));
    }

    const showcaseDoc = await ChanganShowcase.findById(id);

    if (!showcaseDoc) {
      return next(new CustomError(404, "Changan Showcase document not found."));
    }

    // 2. Determine which fieldName was sent from the uploadedFiles object
    const allowedSingleImageFields = ["mockup", "car_banner", "car_brochure"];
    let fieldName = null;
    let uploadedFile = null;

    for (const key of allowedSingleImageFields) {
      if (uploadedFiles && uploadedFiles[key] && uploadedFiles[key][0]) {
        fieldName = key;
        uploadedFile = uploadedFiles[key][0];
        break; // Found the file, exit loop
      }
    }

    // 3. Ensure a new file was provided for an update operation
    if (!fieldName || !uploadedFile) {
      // If no file was uploaded for any of the allowed fields
      return next(
        new CustomError(
          400,
          "No valid image file provided (expected 'mockup', 'car_banner', or 'car_brochure')."
        )
      );
    }

    // Now, fieldName and uploadedFile are correctly identified. Proceed with existing logic.
    const currentFileData = showcaseDoc[fieldName]; // The existing FileUploadSchema object

    // Determine Cloudinary folder path and resource type based on fieldName
    const baseFolderName = `changan/showcase/${showcaseDoc.car_brand.toLowerCase()}/${id}`;
    let subFolder = fieldName;
    let cloudinaryOptions = { resource_type: "image" }; // Default to image

    if (fieldName === "car_brochure") {
      // If it's a brochure, determine resource type based on mimetype
      if (uploadedFile.mimetype === "application/pdf") {
        cloudinaryOptions.resource_type = "raw"; // For PDFs
      } else if (uploadedFile.mimetype.startsWith("video/")) {
        cloudinaryOptions.resource_type = "video"; // For videos
      } else {
        cloudinaryOptions.resource_type = "image"; // Fallback to image
      }
    }

    // 4. Delete the old asset from Cloudinary (if one exists)
    if (currentFileData && currentFileData.cloudinaryPublicId) {
      try {
        const oldResourceType =
          fieldName === "car_brochure" && currentFileData.url.endsWith(".pdf")
            ? "raw"
            : "image";
        await cloudinary.uploader.destroy(currentFileData.cloudinaryPublicId, {
          resource_type: oldResourceType,
        });
      } catch (error) {
        console.error(
          `Error deleting old asset from Cloudinary (${currentFileData.cloudinaryPublicId}):`,
          error
        );
        // Log error but proceed, new upload is more important.
      }
    }

    // 5. Upload the new asset to Cloudinary
    const uploadResult = await imageUploadToCloudinary(
      uploadedFile.buffer,
      `${baseFolderName}/${subFolder}`,
      cloudinaryOptions
    );

    if (
      !uploadResult ||
      !uploadResult.url ||
      !uploadResult.cloudinaryPublicId
    ) {
      return next(
        new CustomError(
          500,
          `Failed to upload new asset for '${fieldName}' to Cloudinary.`
        )
      );
    }

    // 6. Update the document's field with new asset data
    showcaseDoc[fieldName] = {
      url: uploadResult.url,
      cloudinaryPublicId: uploadResult.cloudinaryPublicId,
    };

    // 7. Save the updated document
    showcaseDoc.updatedAt = Date.now();
    await showcaseDoc.save();

    res.status(200).json({
      code: 200,
      status: "success",
      message: `${fieldName} updated successfully.`,
      data: {
        changanShowcase: showcaseDoc.toObject(),
      },
    });
  }
);

export const updateShowcaseCarColorText = asyncErrorHandler(
  async (req, res, next) => {
    const { id, colorId } = req.params; // Showcase ID and CarColor subdocument ID
    const { color_name } = req.body; // New color name

    // 1. Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid Changan Showcase ID."));
    }
    if (!mongoose.Types.ObjectId.isValid(colorId)) {
      return next(new CustomError(400, "Invalid Car Color subdocument ID."));
    }

    const showcaseDoc = await ChanganShowcase.findById(id);

    if (!showcaseDoc) {
      return next(new CustomError(404, "Changan Showcase document not found."));
    }

    // Find the specific CarColor subdocument by its _id
    const carColorToUpdate = showcaseDoc.car_color.id(colorId);

    if (!carColorToUpdate) {
      return next(
        new CustomError(
          404,
          `Car color option with ID '${colorId}' not found in this showcase.`
        )
      );
    }

    // 2. Update color_name if provided
    if (color_name !== undefined) {
      carColorToUpdate.color_name = color_name;
    } else {
      // If no text fields are provided, what's the point of this request?
      return next(
        new CustomError(
          400,
          "No text fields (e.g., color_name) provided for update."
        )
      );
    }

    // 3. Save the updated document
    showcaseDoc.updatedAt = Date.now();
    await showcaseDoc.save();

    res.status(200).json({
      code: 200,
      status: "success",
      message: `Car color text for '${carColorToUpdate.color_name}' updated successfully.`,
      data: {
        changanShowcase: showcaseDoc.toObject(),
      },
    });
  }
);

export const updateShowcaseCarColorImages = asyncErrorHandler(
  async (req, res, next) => {
    const { id, colorId } = req.params; // <-- colorId is now from params again
    const uploadedFiles = req.files; // Multer's .fields() puts files here

    // 1. Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new CustomError(400, "Invalid Changan Showcase ID provided in URL.")
      );
    }
    // The 'colorId' from req.params must be a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(colorId)) {
      // Validation adjusted for params
      return next(
        new CustomError(
          400,
          "Invalid Car Color subdocument ID (colorId) provided in URL."
        )
      );
    }

    const showcaseDoc = await ChanganShowcase.findById(id);

    if (!showcaseDoc) {
      return next(new CustomError(404, "Changan Showcase document not found."));
    }

    // Find the specific CarColor subdocument by its _id within the car_color array
    const carColorToUpdate = showcaseDoc.car_color.id(colorId); // Still uses 'colorId' from params

    if (!carColorToUpdate) {
      return next(
        new CustomError(
          404,
          `Car color option with ID '${colorId}' not found within this showcase's colors.`
        )
      );
    }

    // Extract uploaded files from req.files
    const uploadedCarImage =
      uploadedFiles && uploadedFiles.car_image
        ? uploadedFiles.car_image[0]
        : null;
    const uploadedSwatch =
      uploadedFiles && uploadedFiles.car_color_swatches
        ? uploadedFiles.car_color_swatches[0]
        : null;

    // Ensure at least one file was provided for update
    if (!uploadedCarImage && !uploadedSwatch) {
      return next(
        new CustomError(
          400,
          "No image files (car_image or car_color_swatches) provided for update. At least one is required."
        )
      );
    }

    // Determine Cloudinary folder path. Use the existing color_name for the subfolder.
    const baseFolderName = `changan/showcase/${showcaseDoc.car_brand.toLowerCase()}/${id}`;
    const colorFolderName = carColorToUpdate.color_name
      .replace(/\s+/g, "_")
      .toLowerCase();

    // Helper for uploading and replacing assets on Cloudinary
    const uploadAndReplaceAsset = async (
      currentAsset,
      newFile,
      subfolderPath
    ) => {
      // Delete old asset from Cloudinary if it exists
      if (currentAsset && currentAsset.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(currentAsset.cloudinaryPublicId, {
            resource_type: newFile.mimetype.startsWith("image/")
              ? "image"
              : "raw",
          });
        } catch (error) {
          console.error(
            `Error deleting old asset from Cloudinary (${currentAsset.cloudinaryPublicId}):`,
            error
          );
        }
      }

      // Upload the new asset to Cloudinary
      const uploadResult = await imageUploadToCloudinary(
        newFile.buffer,
        `${baseFolderName}/${subfolderPath}`
      );

      if (
        !uploadResult ||
        !uploadResult.url ||
        !uploadResult.cloudinaryPublicId
      ) {
        throw new CustomError(
          500,
          `Failed to upload new asset for ${subfolderPath} to Cloudinary.`
        );
      }

      // Update the asset data on the subdocument
      currentAsset.url = uploadResult.url;
      currentAsset.cloudinaryPublicId = uploadResult.cloudinaryPublicId;
    };

    // 3. Update car_image if a new file for it was provided
    if (uploadedCarImage) {
      await uploadAndReplaceAsset(
        carColorToUpdate.car_image,
        uploadedCarImage,
        `colors/${colorFolderName}/car_image`
      );
    }

    // 4. Update car_color_swatches if a new file for it was provided
    if (uploadedSwatch) {
      await uploadAndReplaceAsset(
        carColorToUpdate.car_color_swatches,
        uploadedSwatch,
        `colors/${colorFolderName}/swatch`
      );
    }

    // 5. Save the updated main ChanganShowcase document
    showcaseDoc.updatedAt = Date.now();
    await showcaseDoc.save();

    res.status(200).json({
      code: 200,
      status: "success",
      message: `Images for car color '${carColorToUpdate.color_name}' updated successfully.`,
      data: {
        changanShowcase: showcaseDoc.toObject(),
      },
    });
  }
);

export const updateImageInArrayField = asyncErrorHandler(
  async (req, res, next) => {
    const { id, arrayName, imageId } = req.params; // Showcase ID, array name, and the _id of the image to replace
    const uploadedFile = req.file; // The new image file from Multer

    // 1. Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid Changan Showcase ID."));
    }
    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return next(new CustomError(400, "Invalid image ID provided."));
    }

    const showcaseDoc = await ChanganShowcase.findById(id);

    if (!showcaseDoc) {
      return next(new CustomError(404, "Changan Showcase document not found."));
    }

    // 2. Validate the arrayName against allowed array fields
    const allowedArrayFields = ["car_exterior", "car_interior", "gallery"];
    if (!allowedArrayFields.includes(arrayName)) {
      return next(
        new CustomError(
          400,
          `Invalid array field name '${arrayName}'. Must be one of: ${allowedArrayFields.join(
            ", "
          )}.`
        )
      );
    }

    // 3. Ensure a new file was provided for replacement
    if (!uploadedFile) {
      return next(
        new CustomError(400, "No new file provided for image replacement.")
      );
    }

    // Find the specific image within the specified array by its _id
    const imageArray = showcaseDoc[arrayName]; // Get the target array (e.g., showcaseDoc.car_exterior)
    const imageToUpdate = imageArray.id(imageId); // Use Mongoose's .id() to find the subdocument

    if (!imageToUpdate) {
      return next(
        new CustomError(
          404,
          `Image with ID '${imageId}' not found in the '${arrayName}' array.`
        )
      );
    }

    // Determine Cloudinary folder path. Use the array name as the subfolder.
    const baseFolderName = `changan/showcase/${showcaseDoc.car_brand.toLowerCase()}/${id}`;
    const subFolder = arrayName;

    // Determine resource type for Cloudinary based on mimetype
    let cloudinaryOptions = { resource_type: "image" };
    if (uploadedFile.mimetype === "application/pdf") {
      cloudinaryOptions.resource_type = "raw";
    } else if (uploadedFile.mimetype.startsWith("video/")) {
      cloudinaryOptions.resource_type = "video";
    }

    // 4. Delete the old asset from Cloudinary (if one exists)
    if (imageToUpdate.cloudinaryPublicId) {
      try {
        // Infer resource type for deletion. Ideally, you'd store this info in FileUploadSchema.
        // For now, making a best guess based on common cases.
        const oldResourceType = imageToUpdate.url.includes(".pdf")
          ? "raw"
          : imageToUpdate.url.includes(".mp4") ||
            imageToUpdate.url.includes(".mov")
          ? "video"
          : "image";
        await cloudinary.uploader.destroy(imageToUpdate.cloudinaryPublicId, {
          resource_type: oldResourceType,
        });
      } catch (error) {
        console.error(
          `Error deleting old asset from Cloudinary (${imageToUpdate.cloudinaryPublicId}):`,
          error
        );
        // Log the error but proceed; the new upload is more critical.
      }
    }

    // 5. Upload the new asset to Cloudinary
    const uploadResult = await imageUploadToCloudinary(
      uploadedFile.buffer,
      `${baseFolderName}/${subFolder}`,
      cloudinaryOptions
    );

    if (
      !uploadResult ||
      !uploadResult.url ||
      !uploadResult.cloudinaryPublicId
    ) {
      return next(
        new CustomError(
          500,
          `Failed to upload new file for '${arrayName}' image replacement.`
        )
      );
    }

    // 6. Update the properties of the existing image subdocument
    imageToUpdate.url = uploadResult.url;
    imageToUpdate.cloudinaryPublicId = uploadResult.cloudinaryPublicId;

    // 7. Save the updated main document
    showcaseDoc.updatedAt = Date.now();
    await showcaseDoc.save();

    res.status(200).json({
      code: 200,
      status: "success",
      message: `Image with ID '${imageId}' in '${arrayName}' updated successfully.`,
      data: {
        changanShowcase: showcaseDoc.toObject(),
      },
    });
  }
);

export const deleteChanganShowcase = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params; // Showcase ID

    // 1. Validate ChanganShowcase ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[DELETE] Invalid Changan Showcase ID: ${id}`);
      return next(new CustomError(400, "Invalid Changan Showcase ID."));
    }

    // 2. Find the document to ensure it exists (and get car_brand for folder path)
    const showcaseDoc = await ChanganShowcase.findById(id);

    if (!showcaseDoc) {
      console.log(`[DELETE] Changan Showcase document not found for ID: ${id}`);
      return next(new CustomError(404, "Changan Showcase document not found."));
    }

    // --- CLOUDINARY DELETION ATTEMPT ---
    let cloudCleanupMessage = "Cloudinary cleanup attempted.";
    const showcaseFolderPath = `changan/showcase/${showcaseDoc.car_brand.toLowerCase()}/${id}`;

    console.log(
      `[DELETE] Starting Cloudinary cleanup for folder: ${showcaseFolderPath}`
    );
    console.log(
      `[DELETE] Cloudinary Config Check: Cloud Name - ${
        cloudinary.config().cloud_name
      }, API Key - ${cloudinary.config().api_key ? "Set" : "Not Set"}`
    );

    try {
      // FIRST: Delete all assets within the folder by prefix
      console.log(
        `[DELETE] Deleting all assets with prefix: ${showcaseFolderPath}`
      );
      const assetDeletionResult =
        await cloudinary.api.delete_resources_by_prefix(showcaseFolderPath);
      console.log(
        `[DELETE] Cloudinary asset deletion by prefix result:`,
        assetDeletionResult
      );

      // Cloudinary's delete_resources_by_prefix will return { deleted: [], not_found: [] }
      // It doesn't typically throw an error if no assets are found.
      if (
        assetDeletionResult.deleted &&
        assetDeletionResult.deleted.length > 0
      ) {
        console.log(
          `[DELETE] Successfully deleted ${assetDeletionResult.deleted.length} assets.`
        );
        cloudCleanupMessage += ` Deleted ${assetDeletionResult.deleted.length} assets.`;
      }
      if (
        assetDeletionResult.not_found &&
        assetDeletionResult.not_found.length > 0
      ) {
        console.log(
          `[DELETE] ${assetDeletionResult.not_found.length} assets not found during prefix deletion.`
        );
      }

      // SECOND: Attempt to delete the now (potentially) empty folder
      // This step is often not strictly necessary as deleting all assets might also implicitly remove empty folders,
      // but it ensures the folder is explicitly gone if it wasn't removed by asset deletion.
      console.log(
        `[DELETE] Attempting to delete the (now empty) folder: ${showcaseFolderPath}`
      );
      const folderDeletionResult = await cloudinary.api.delete_folder(
        showcaseFolderPath
      );
      console.log(
        `[DELETE] Cloudinary folder deletion result:`,
        folderDeletionResult
      );

      if (folderDeletionResult.result === "ok") {
        console.log(
          `[DELETE] Cloudinary folder ${showcaseFolderPath} successfully deleted.`
        );
        cloudCleanupMessage += " Folder deleted.";
      } else if (
        folderDeletionResult.error &&
        folderDeletionResult.error.message === "Not found"
      ) {
        console.log(
          `[DELETE] Cloudinary folder ${showcaseFolderPath} was already empty or not found (no action needed).`
        );
        cloudCleanupMessage += " Folder already absent.";
      } else if (folderDeletionResult.error) {
        console.error(
          `[DELETE] Cloudinary API error during folder deletion for ${showcaseFolderPath}:`,
          folderDeletionResult.error
        );
        cloudCleanupMessage += ` Error deleting folder: ${folderDeletionResult.error.message}.`;
      } else {
        console.warn(
          `[DELETE] Unexpected Cloudinary folder deletion result structure for ${showcaseFolderPath}:`,
          folderDeletionResult
        );
        cloudCleanupMessage += " Unexpected folder deletion result.";
      }
    } catch (error) {
      // This catches critical errors like network issues or authentication failures
      console.error(
        `[DELETE] Critical error during Cloudinary cleanup for ${showcaseFolderPath}:`,
        error
      );
      cloudCleanupMessage += ` Critical cleanup error: ${error.message}.`;
      // Decide if you want DB deletion to be conditional on successful Cloudinary deletion.
      // For now, we proceed to DB deletion.
    }
    // --- END CLOUDINARY DELETION ATTEMPT ---

    // 5. Delete the document from MongoDB regardless of Cloudinary cleanup outcome
    console.log(
      `[DELETE] Attempting to delete document from MongoDB for ID: ${id}`
    );
    const result = await ChanganShowcase.findByIdAndDelete(id);

    if (!result) {
      console.error(
        `[DELETE] Failed to delete Changan Showcase document from database for ID: ${id}. Document might have been concurrently deleted.`
      );
      return next(
        new CustomError(
          500,
          "Failed to delete Changan Showcase document from database."
        )
      );
    }

    console.log(
      `[DELETE] MongoDB document with ID: ${id} deleted successfully.`
    );

    res.status(200).json({
      code: 200,
      status: "success",
      message: `Changan Showcase document deleted. ${cloudCleanupMessage}`,
    });
  }
);

// export const deleteImageFromShowcase = asyncErrorHandler(
//   async (req, res, next) => {
//     const { id, fieldName, imageId } = req.params; // Showcase ID, field/array name, and optional image ID

//     // 1. Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return next(new CustomError(400, "Invalid Changan Showcase ID."));
//     }

//     const showcaseDoc = await ChanganShowcase.findById({ _id: id });

//     if (!showcaseDoc) {
//       return next(new CustomError(404, "Changan Showcase document not found."));
//     }

//     // 2. Validate the fieldName against allowed fields
//     const singleImageFields = ["mockup", "car_banner", "car_brochure"];
//     const arrayImageFields = ["car_exterior", "car_interior", "gallery"];
//     const allAllowedFields = [...singleImageFields, ...arrayImageFields];

//     if (!allAllowedFields.includes(fieldName)) {
//       return next(
//         new CustomError(
//           400,
//           `Invalid field name '${fieldName}'. Must be one of: ${allAllowedFields.join(
//             ", "
//           )}.`
//         )
//       );
//     }

//     let assetToDelete = null;
//     let deletionMessage = "";

//     // 3. Handle deletion based on field type
//     if (singleImageFields.includes(fieldName)) {
//       // For single top-level image fields (e.g., mockup)
//       if (imageId) {
//         // imageId should not be provided for single fields
//         return next(
//           new CustomError(
//             400,
//             `Image ID not expected for single field '${fieldName}'.`
//           )
//         );
//       }
//       assetToDelete = showcaseDoc[fieldName];

//       if (assetToDelete && assetToDelete.cloudinaryPublicId) {
//         // Clear the image data from the document
//         showcaseDoc[fieldName].url = null;
//         showcaseDoc[fieldName].cloudinaryPublicId = null;
//         deletionMessage = `Image from field '${fieldName}' deleted.`;
//       } else {
//         return next(
//           new CustomError(
//             404,
//             `No image found in field '${fieldName}' to delete.`
//           )
//         );
//       }
//     } else if (arrayImageFields.includes(fieldName)) {
//       // For array image fields (e.g., car_exterior, gallery)
//       if (!imageId || !mongoose.Types.ObjectId.isValid(imageId)) {
//         return next(
//           new CustomError(
//             400,
//             `Image ID is required and must be valid for array field '${fieldName}'.`
//           )
//         );
//       }

//       const targetArray = showcaseDoc[fieldName];
//       assetToDelete = targetArray.id(imageId); // Find subdocument by its _id

//       if (assetToDelete && assetToDelete.cloudinaryPublicId) {
//         targetArray.pull(imageId); // Remove the subdocument from the array
//         deletionMessage = `Image with ID '${imageId}' from '${fieldName}' array deleted.`;
//       } else {
//         return next(
//           new CustomError(
//             404,
//             `Image with ID '${imageId}' not found in the '${fieldName}' array.`
//           )
//         );
//       }
//     }

//     // 4. Delete the asset from Cloudinary
//     if (assetToDelete && assetToDelete.cloudinaryPublicId) {
//       try {
//         // Attempt to infer resource type for deletion.
//         // (Ideally, resource_type would be stored in your FileUploadSchema).
//         let resource_type = "image";
//         if (assetToDelete.url && assetToDelete.url.includes(".pdf")) {
//           resource_type = "raw";
//         } else if (
//           assetToDelete.url &&
//           (assetToDelete.url.includes(".mp4") ||
//             assetToDelete.url.includes(".mov") ||
//             assetToDelete.url.includes(".webm"))
//         ) {
//           resource_type = "video";
//         }

//         const cloudinaryDeleteResult = await cloudinary.uploader.destroy(
//           assetToDelete.cloudinaryPublicId,
//           { resource_type }
//         );
//         console.log(
//           `Cloudinary deletion result for ${assetToDelete.cloudinaryPublicId}:`,
//           cloudinaryDeleteResult
//         );

//         if (
//           cloudinaryDeleteResult.result !== "ok" &&
//           cloudinaryDeleteResult.result !== "not found"
//         ) {
//           console.warn(
//             `[DELETE] Cloudinary issue for ${assetToDelete.cloudinaryPublicId}:`,
//             cloudinaryDeleteResult
//           );
//           // Do not block the request if Cloudinary deletion has a minor issue, but log it.
//           deletionMessage += " Cloudinary deletion had an issue.";
//         }
//       } catch (error) {
//         console.error(
//           `[DELETE] Error deleting asset ${assetToDelete.cloudinaryPublicId} from Cloudinary:`,
//           error
//         );
//         // Log error but proceed with DB save.
//         deletionMessage += " Error during Cloudinary deletion.";
//       }
//     } else {
//       console.warn(
//         `[DELETE] No Cloudinary Public ID found for asset in field '${fieldName}' to delete.`
//       );
//     }

//     // 5. Save the updated document (with the image field cleared or array modified)
//     showcaseDoc.updatedAt = Date.now();
//     await showcaseDoc.save();

//     res.status(200).json({
//       code: 200,
//       status: "success",
//       message: deletionMessage,
//       data: {
//         changanShowcase: showcaseDoc.toObject(),
//       },
//     });
//   }
// );

// export const deleteCarColorImage = asyncErrorHandler(async (req, res, next) => {
//   const { id, colorId, imageType } = req.params; // Showcase ID, CarColor ID, and type of image (car_image/car_color_swatches)

//   // 1. Validate IDs
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return next(new CustomError(400, "Invalid Changan Showcase ID."));
//   }
//   if (!mongoose.Types.ObjectId.isValid(colorId)) {
//     return next(new CustomError(400, "Invalid Car Color ID."));
//   }

//   const showcaseDoc = await ChanganShowcase.findById(id);

//   if (!showcaseDoc) {
//     return next(new CustomError(404, "Changan Showcase document not found."));
//   }

//   // 2. Find the specific CarColor subdocument
//   const carColorToUpdate = showcaseDoc.car_color.id(colorId);

//   if (!carColorToUpdate) {
//     return next(
//       new CustomError(404, `Car color option with ID '${colorId}' not found.`)
//     );
//   }

//   // 3. Validate the imageType
//   const allowedImageTypes = ["car_image", "car_color_swatches"];
//   if (!allowedImageTypes.includes(imageType)) {
//     return next(
//       new CustomError(
//         400,
//         `Invalid image type '${imageType}'. Must be 'car_image' or 'car_color_swatches'.`
//       )
//     );
//   }

//   const assetToDelete = carColorToUpdate[imageType]; // Get the specific image object (e.g., carColorToUpdate.car_image)

//   if (!assetToDelete || !assetToDelete.cloudinaryPublicId) {
//     return next(
//       new CustomError(
//         404,
//         `No image found for type '${imageType}' in car color ID '${colorId}'.`
//       )
//     );
//   }

//   // 4. Delete the asset from Cloudinary
//   try {
//     // Attempt to infer resource type for deletion.
//     let resource_type = "image";
//     if (assetToDelete.url && assetToDelete.url.includes(".pdf")) {
//       resource_type = "raw";
//     } else if (
//       assetToDelete.url &&
//       (assetToDelete.url.includes(".mp4") ||
//         assetToDelete.url.includes(".mov") ||
//         assetToDelete.url.includes(".webm"))
//     ) {
//       resource_type = "video";
//     }

//     const cloudinaryDeleteResult = await cloudinary.uploader.destroy(
//       assetToDelete.cloudinaryPublicId,
//       { resource_type }
//     );
//     console.log(
//       `Cloudinary deletion result for ${assetToDelete.cloudinaryPublicId}:`,
//       cloudinaryDeleteResult
//     );

//     if (
//       cloudinaryDeleteResult.result !== "ok" &&
//       cloudinaryDeleteResult.result !== "not found"
//     ) {
//       console.warn(
//         `[DELETE] Cloudinary issue for ${assetToDelete.cloudinaryPublicId}:`,
//         cloudinaryDeleteResult
//       );
//     }
//   } catch (error) {
//     console.error(
//       `[DELETE] Error deleting asset ${assetToDelete.cloudinaryPublicId} from Cloudinary:`,
//       error
//     );
//   }

//   // 5. Clear the image data from the Mongoose document
//   assetToDelete.url = null;
//   assetToDelete.cloudinaryPublicId = null;

//   // 6. Save the updated main document
//   showcaseDoc.updatedAt = Date.now();
//   await showcaseDoc.save();

//   res.status(200).json({
//     code: 200,
//     status: "success",
//     message: `Image of type '${imageType}' for car color ID '${colorId}' deleted successfully.`,
//     data: {
//       changanShowcase: showcaseDoc.toObject(),
//     },
//   });
// });
