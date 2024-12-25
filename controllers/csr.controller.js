import CSR from "../models/csr.model.js";
import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import fs from "fs";

export const csrUpload = asyncErrorHandler(async (req, res, next) => {
  // Check if files are provided
  if (!req.files || req.files.length === 0) {
    return next(new CustomError(400, "There are no images to upload"));
  }

  const { category, title, body, eventDate } = req.body;
  const domainName = req.user.domainName;

  // Check for missing required fields
  if (!category || !title || !body) {
    return next(
      new CustomError(400, "Missing required fields: category, title, or body")
    );
  }

  // Check if category is "News" and eventDate is provided
  if (category === "News" && eventDate) {
    return next(
      new CustomError(
        400,
        "eventDate should not be provided when the category is 'News'"
      )
    );
  }

  // Prepare the CSR object
  const images = req.files.map((file) => ({
    filename: file.filename,
    filepath: file.path,
  }));

  const newCSR = new CSR({
    images,
    domainName,
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
      // Delete files if database save fails
      await Promise.all(req.files.map((file) => fs.unlink(file.path)));
      next(new CustomError(500, "Failed to save CSR"));
    });
});

export const csrAdditionalUpload = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if files are provided
  if (!req.files || req.files.length === 0) {
    return next(new CustomError(400, "No images to upload"));
  }

  // Check if the number of files exceeds the limit
  if (req.files.length > 10) {
    return next(
      new CustomError(400, "You can only upload a maximum of 10 images")
    );
  }

  // Find the CSR by ID
  const csr = await CSR.findById(id);
  if (!csr) {
    return next(new CustomError(404, "CSR not found"));
  }

  // Check if the total number of images exceeds the limit
  const totalImages = csr.images.length + req.files.length;
  if (totalImages > 10) {
    return next(
      new CustomError(400, "The total number of images exceeds the limit of 10")
    );
  }

  // Add new images to the CSR
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
      CSR: rest, // Updated to return the updated CSR
    },
  });
});

export const csrPublic = asyncErrorHandler(async (req, res, next) => {
  const { domainName } = req;

  if (!domainName) {
    return next(new CustomError(400, "Domain name not found."));
  }
  const csrs = await CSR.find({ domainName });

  if (csrs.length === 0) {
    return next(new CustomError(404, "No CSRs found for this domain."));
  }

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
  const { domainName } = req;
  const { id } = req.params;

  if (!domainName) {
    return next(new CustomError(400, "Domain name not found."));
  }

  const csr = await CSR.findOne({ _id: id, domainName });

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

export const csrCms = asyncErrorHandler(async (req, res, next) => {
  const domainName = req.user.domainName;

  if (!domainName) {
    return next(
      new CustomError(400, "Domain name not found for the authenticated user.")
    );
  }

  const csrs = await CSR.find({ domainName });

  // if (csrs.length === 0) {
  //   return next(new CustomError(404, "No CSRs found for this domain."));
  // }

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

export const getCsrCmsById = asyncErrorHandler(async (req, res, next) => {
  const domainName = req.user.domainName;
  const { id } = req.params;

  if (!domainName) {
    return next(
      new CustomError(400, "Domain name not found for the authenticated user.")
    );
  }

  if (!id) {
    return next(new CustomError(400, "CSR ID is required."));
  }

  const csr = await CSR.findOne({ _id: id, domainName });

  if (!csr) {
    return next(
      new CustomError(404, "CSR not found for the given domain and ID.")
    );
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
  const { domainName } = req.user;
  const { category, title, body, eventDate, imageIds } = req.body;

  const csr = await CSR.findOne({ _id: id, domainName });
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

      console.log(`Processing Image ID: ${imageId}, New File:`, newFile);

      const imageIndex = csr.images.findIndex(
        (img) => img._id.toString() === imageId
      );
      if (imageIndex === -1) {
        return next(
          new CustomError(404, `Image with ID ${imageId} not found.`)
        );
      }

      const oldFilePath = csr.images[imageIndex].filepath;
      console.log(`Deleting old file at: ${oldFilePath}`);
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
  const { domainName } = req.user;

  // Find the CSR by ID and domainName
  const csr = await CSR.findOne({ _id: id, domainName });
  if (!csr) {
    return next(
      new CustomError(404, "CSR not found or not authorized to delete")
    );
  }

  // If image array exists, remove the associated image files from the filesystem
  if (csr.images && csr.images.length > 0) {
    for (const image of csr.images) {
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
  await CSR.deleteOne({ _id: id });

  res.status(200).json({
    code: 200,
    status: "success",
    message: "CSR deleted successfully",
  });
});

export const csrImageDelete = asyncErrorHandler(async (req, res, next) => {
  const { id, imageId } = req.params;
  const { domainName } = req.user;

  // Find the CSR by ID and domainName
  const csr = await CSR.findOne({ _id: id, domainName });
  if (!csr) {
    return next(
      new CustomError(404, "CSR not found or not authorized to update")
    );
  }

  // Find the image to be deleted
  const imageIndex = csr.images.findIndex(
    (img) => img._id.toString() === imageId
  );
  if (imageIndex === -1) {
    return next(new CustomError(404, "Image not found"));
  }

  // Remove the old image file from the filesystem if it exists
  const oldImage = csr.images[imageIndex];
  if (oldImage.filepath && fs.existsSync(oldImage.filepath)) {
    try {
      await fs.promises.unlink(oldImage.filepath);
    } catch (err) {
      return next(new CustomError(500, "Failed to delete the current image"));
    }
  }

  // Remove the image from the CSR's images array
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

// export const csrDocDelete = asyncErrorHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const { domainName } = req.user;

//   // Find the CSR by ID and domainName
//   const csr = await CSR.findOne({ _id: id, domainName });
//   if (!csr) {
//     return next(
//       new CustomError(404, "CSR not found or not authorized to delete")
//     );
//   }

//   // Delete all images associated with the CSR
//   for (const image of csr.images) {
//     if (image.filepath && fs.existsSync(image.filepath)) {
//       try {
//         await fs.promises.unlink(image.filepath);
//       } catch (err) {
//         return next(
//           new CustomError(500, "Failed to delete one or more images")
//         );
//       }
//     }
//   }

//   // Delete the CSR document
//   await CSR.findByIdAndDelete(id);

//   res.status(200).json({
//     code: 200,
//     status: "success",
//     message: "CSR deleted successfully.",
//   });
// });
