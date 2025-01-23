import brandOverview from "../models/brandOverview.model.js";
import BrandOverview from "../models/brandOverview.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import fs from "fs";
import path from "path";

export const createBrandOverview = asyncErrorHandler(async (req, res, next) => {
  const { car_brand } = req.body;

  if (!req.files || req.files.length === 0) {
    return next(new CustomError(400, "There are no images to upload"));
  }

  if (req.files.length > 8) {
    return next(new CustomError(400, "You can upload a maximum of 8 images"));
  }

  if (!car_brand) {
    return next(new CustomError(400, "You have to choose car brand."));
  }

  const images = req.files.map((file) => ({
    filename: file.filename,
    filepath: file.path,
  }));

  const newCarBrandOverview = new BrandOverview({
    images,
    car_brand,
  });

  newCarBrandOverview.save();
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Car brand overview have created successfully.",
    data: {
      car_brand_overview: newCarBrandOverview,
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

export const getById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const brandOverview = await BrandOverview.findById({ _id: id }).lean();
  if (!brandOverview) {
    return next(new CustomError(404, "There is no data with the given id."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Car brand overview data successfully retrived.",
    data: {
      brandOverview,
    },
  });
});

export const additionalUpload = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if files are provided
  if (!req.files || req.files.length === 0) {
    return next(new CustomError(400, "No images to upload"));
  }

  // Check if the number of files exceeds the limit
  if (req.files.length > 8) {
    return next(
      new CustomError(400, "You can only upload a maximum of 8 images")
    );
  }

  // Find the CSR by ID
  const carBrandOverview = await BrandOverview.findById(id);
  if (!carBrandOverview) {
    return next(new CustomError(404, "There is no data with the given Id"));
  }

  // Check if the total number of images exceeds the limit
  const totalImages = carBrandOverview.images.length + req.files.length;
  if (totalImages > 8) {
    return next(
      new CustomError(400, "The total number of images exceeds the limit of 10")
    );
  }

  // Add new images to the CSR
  const newImages = req.files.map((file) => ({
    filename: file.filename,
    filepath: file.path,
  }));

  carBrandOverview.images.push(...newImages);
  await carBrandOverview.save();
  const { __v, ...rest } = carBrandOverview._doc;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Images added successfully.",
    data: {
      count: rest.images.length,
      rest,
    },
  });
});

export const deleteBrandOverview = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const carBrandOverview = await BrandOverview.findOne({ _id: id });
  if (!carBrandOverview) {
    return next(new CustomError(404, "Data canonot find with the given Id."));
  }

  if (carBrandOverview.images && carBrandOverview.images.length > 0) {
    for (const image of carBrandOverview.images) {
      const imagePath = image.filepath;
      if (imagePath && fs.existsSync(imagePath)) {
        // Synchronously check if the file exists
        try {
          fs.unlinkSync(imagePath); // Synchronously delete the image file
          console.log(`Deleted image file: ${imagePath}`);
        } catch (err) {
          console.error(`Failed to delete image file at: ${imagePath}`);
          return next(
            new CustomError(500, "Failed to delete the associated image file")
          );
        }
      }
    }
  }

  // Delete the CSR from the database
  await BrandOverview.deleteOne({ _id: id });

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Car Overview data have been deleted successfully",
  });
});

export const brandOverviewImageDelete = asyncErrorHandler(
  async (req, res, next) => {
    const { id, imageId } = req.params;

    // Find the CSR by ID and domainName
    const brandOverview = await BrandOverview.findOne({ _id: id });
    if (!brandOverview) {
      return next(new CustomError(404, "Data cannot find with the given Id."));
    }

    // Find the image to be deleted
    const imageIndex = brandOverview.images.findIndex(
      (img) => img._id.toString() === imageId
    );
    if (imageIndex === -1) {
      return next(new CustomError(404, "Image not found"));
    }

    // Remove the old image file from the filesystem if it exists
    const oldImage = brandOverview.images[imageIndex];
    if (oldImage.filepath && fs.existsSync(oldImage.filepath)) {
      try {
        await fs.promises.unlink(oldImage.filepath);
      } catch (err) {
        return next(new CustomError(500, "Failed to delete the current image"));
      }
    }

    // Remove the image from the CSR's images array
    brandOverview.images.splice(imageIndex, 1);
    await brandOverview.save();

    res.status(200).json({
      code: 200,
      status: "success",
      message: "Image deleted successfully.",
      data: {
        brandOverview,
      },
    });
  }
);
