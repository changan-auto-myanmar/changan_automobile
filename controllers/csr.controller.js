import CSR from "../models/csr.model.js";
import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import fs from "fs";

export const csrUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new CustomError(400, "There are no images to upload"));
  }

  const { category, title, body, eventDate } = req.body;
  if (!category || !title || !body) {
    return next(
      new CustomError(400, "Missing required fields: category, title, or body")
    );
  }

  if (category === "News" && eventDate) {
    return next(
      new CustomError(
        400,
        "eventDate should not be provided when the category is 'News'"
      )
    );
  }

  const images = req.files.map((file) => ({
    filename: file.filename,
    filepath: file.path,
  }));

  const newCSR = new CSR({
    images,
    category,
    title,
    body,
    eventDate: category !== "News" ? eventDate : undefined,
  });

  // Save to the database
  newCSR
    .save()
    .then((savedCSR) => {
      const { __v, ...rest } = savedCSR._doc;
      res.status(200).json({
        code: 200,
        status: "success",
        message: "CSR created successfully.",
        data: { CSR: rest },
      });
    })
    .catch(async () => {
      await Promise.all(req.files.map((file) => fs.unlink(file.path)));
      next(new CustomError(500, "Failed to save CSR"));
    });
});

export const csrAdditionalUpload = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    return next(new CustomError(400, "No images to upload"));
  }

  if (req.files.length > 10) {
    return next(
      new CustomError(400, "You can only upload a maximum of 10 images")
    );
  }

  const csr = await CSR.findById(id);
  if (!csr) {
    return next(new CustomError(404, "CSR not found"));
  }

  const totalImages = csr.images.length + req.files.length;
  if (totalImages > 10) {
    return next(
      new CustomError(400, "The total number of images exceeds the limit of 10")
    );
  }

  const newImages = req.files.map((file) => ({
    filename: file.filename,
    filepath: file.path,
  }));

  csr.images.push(...newImages);
  await csr.save();
  const { __v, ...rest } = csr._doc;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Images added successfully.",
    data: {
      count: rest.images.length,
      CSR: rest,
    },
  });
});

export const csrPublic = asyncErrorHandler(async (req, res, next) => {
  const csrs = await CSR.find({});

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      CSR: csrs.map((csr) => ({
        ...csr.toObject(),
        count: csr.images.length,
      })),
    },
  });
});

export const getCsrPublicById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const csr = await CSR.findOne({ _id: id });

  if (!csr) {
    return next(new CustomError(404, "CSR not found for this domain."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      CSR: {
        ...csr.toObject(),
        count: csr.images.length,
      },
    },
  });
});

export const csrUpdate = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { category, title, body, eventDate, imageIds } = req.body;

  const csr = await CSR.findOne({ _id: id });
  if (!csr) {
    return next(
      new CustomError(404, "CSR not found or not authorized to update.")
    );
  }

  const parsedImageIds = imageIds ? JSON.parse(imageIds) : [];
  const files = req.files || [];

  if (
    parsedImageIds.length > 0 &&
    files.length > 0 &&
    parsedImageIds.length !== files.length
  ) {
    return next(
      new CustomError(400, "Mismatched imageIds and files array lengths.")
    );
  }

  if (parsedImageIds.length > 0) {
    for (let i = 0; i < parsedImageIds.length; i++) {
      const imageId = parsedImageIds[i];
      const newFile = files[i];

      const imageIndex = csr.images.findIndex(
        (img) => img._id.toString() === imageId
      );
      if (imageIndex === -1) {
        return next(
          new CustomError(404, `Image with ID ${imageId} not found.`)
        );
      }

      const oldFilePath = csr.images[imageIndex].filepath;
      if (fs.existsSync(oldFilePath)) {
        await fs.promises.unlink(oldFilePath);
      }

      csr.images[imageIndex] = {
        filename: newFile.filename,
        filepath: newFile.path,
      };
    }
  }

  if (title) csr.title = title;
  if (body) csr.body = body;

  if (category) {
    csr.category = category;

    if (category === "News" && csr.eventDate) {
      csr.eventDate = undefined;
    }
  }

  if (eventDate) {
    if (csr.category !== "News") {
      csr.eventDate = eventDate;
    } else {
      return next(
        new CustomError(
          400,
          "eventDate should not be provided when the category is 'News'."
        )
      );
    }
  }

  const updatedCSR = await csr.save();

  res.status(200).json({
    status: "success",
    message: "CSR updated successfully.",
    data: updatedCSR,
  });
});

export const csrDelete = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const csr = await CSR.findOne({ _id: id });

  if (!csr) {
    return next(
      new CustomError(404, "CSR not found or not authorized to delete")
    );
  }

  if (csr.images && csr.images.length > 0) {
    for (const image of csr.images) {
      const imagePath = image.filepath;
      if (imagePath && fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
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

  await CSR.deleteOne({ _id: id });

  res.status(200).json({
    code: 200,
    status: "success",
    message: "CSR deleted successfully",
  });
});

export const csrImageDelete = asyncErrorHandler(async (req, res, next) => {
  const { id, imageId } = req.params;
  const csr = await CSR.findOne({ _id: id });

  if (!csr) {
    return next(
      new CustomError(404, "CSR not found or not authorized to delete")
    );
  }
  const imageIndex = csr.images.findIndex(
    (img) => img._id.toString() === imageId
  );
  if (imageIndex === -1) {
    return next(new CustomError(404, "Image not found"));
  }

  const oldImage = csr.images[imageIndex];
  if (oldImage.filepath && fs.existsSync(oldImage.filepath)) {
    try {
      await fs.promises.unlink(oldImage.filepath);
    } catch (err) {
      return next(new CustomError(500, "Failed to delete the current image"));
    }
  }

  csr.images.splice(imageIndex, 1);
  await csr.save();

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Image deleted successfully.",
    data: {
      CSR: csr,
    },
  });
});
