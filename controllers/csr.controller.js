import CSR from "../models/csr.model.js";
import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import fs from "fs";

export const csrUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.file || req.file.length === 0) {
    return next(new CustomError(400, "There is no image to upload"));
  }

  const { filename, path: filepath } = req.file;

  const domainName = req.user.domainName;
  const { category, title, sub_title, body, eventDate } = req.body;

  if ((!category || !title || !body, sub_title)) {
    return next(new CustomError(400, "Please fill all the required fields."));
  }

  // Check if category is "News" and eventDate is provided
  if (category === "News" && eventDate) {
    return next(
      new CustomError(
        400,
        "eventDate should not be provided when the category is 'News'."
      )
    );
  }

  // Prepare the CSR object, including eventDate only if it's not News
  const newCSR = new CSR({
    image: {
      filename,
      filepath,
    },
    domainName,
    category,
    sub_title,
    body,
    title,
    eventDate: category !== "News" ? eventDate : undefined, // Add eventDate only if not News
  });

  const savedCSR = await newCSR.save();
  const { __v, ...rest } = savedCSR._doc;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "CSR created successfully.",
    data: {
      CSR: rest,
    },
  });
});

// export const csrAdditionalUpload = asyncErrorHandler(async (req, res, next) => {
//   const { id } = req.params;

//   // Check if files are provided
//   if (!req.files || req.files.length === 0) {
//     return next(new CustomError(400, "No images to upload"));
//   }

//   // Check if the number of files exceeds the limit
//   if (req.files.length > 10) {
//     return next(
//       new CustomError(400, "You can only upload a maximum of 10 images")
//     );
//   }

//   // Find the CSR by ID
//   const csr = await CSR.findById(id);
//   if (!csr) {
//     return next(new CustomError(404, "CSR not found"));
//   }

//   // Check if the total number of images exceeds the limit
//   const totalImages = csr.images.length + req.files.length;
//   if (totalImages > 10) {
//     return next(
//       new CustomError(400, "The total number of images exceeds the limit of 10")
//     );
//   }

//   // Add new images to the CSR
//   const newImages = req.files.map((file) => ({
//     filename: file.filename,
//     filepath: file.path,
//   }));

//   csr.images.push(...newImages);
//   await csr.save();
//   const { __v, ...rest } = csr._doc;

//   res.status(200).json({
//     code: 200,
//     status: "success",
//     message: "Images added successfully.",
//     data: {
//       count: rest.images.length,
//       CSR: rest, // Updated to return the updated CSR
//     },
//   });
// });

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

export const csrCms = asyncErrorHandler(async (req, res, next) => {
  const domainName = req.user.domainName;

  if (!domainName) {
    return next(
      new CustomError(400, "Domain name not found for the authenticated user.")
    );
  }

  // Fetch banners for the domain
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

export const csrUpdate = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { domainName } = req.user;

  const csr = await CSR.findOne({ _id: id, domainName });
  if (!csr) {
    return next(
      new CustomError(404, "CSR not found or not authorized to update")
    );
  }

  if (req.file) {
    const { filename, path: filepath } = req.file;

    if (csr.image?.filepath && fs.existsSync(csr.image.filepath)) {
      try {
        await fs.promises.unlink(csr.image.filepath);
      } catch (err) {
        return next(new CustomError(500, "Failed to delete the current image"));
      }
    }

    csr.image = { filename, filepath };
  }

  if (req.body.textBody) {
    csr.textBody = req.body.textBody;
  }

  if (req.body.category) {
    csr.category = req.body.category;

    if (req.body.category === "News" && csr.eventDate) {
      csr.eventDate = undefined;
    }
  }

  if (req.body.eventDate) {
    if (csr.category !== "News") {
      csr.eventDate = req.body.eventDate;
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
  const { __v, ...rest } = updatedCSR._doc;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "CSR updated successfully.",
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

  // Remove the associated image file from the filesystem if it exists
  if (csr.image?.filepath && fs.existsSync(csr.image.filepath)) {
    try {
      await fs.promises.unlink(csr.image.filepath);
    } catch (err) {
      return next(
        new CustomError(500, "Failed to delete the associated image file")
      );
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

// export const csrImageDelete = asyncErrorHandler(async (req, res, next) => {
//   const { id, imageId } = req.params;
//   const { domainName } = req.user;

//   // Find the CSR by ID and domainName
//   const csr = await CSR.findOne({ _id: id, domainName });
//   if (!csr) {
//     return next(
//       new CustomError(404, "CSR not found or not authorized to update")
//     );
//   }

//   // Find the image to be deleted
//   const imageIndex = csr.images.findIndex(
//     (img) => img._id.toString() === imageId
//   );
//   if (imageIndex === -1) {
//     return next(new CustomError(404, "Image not found"));
//   }

//   // Remove the old image file from the filesystem if it exists
//   const oldImage = csr.images[imageIndex];
//   if (oldImage.filepath && fs.existsSync(oldImage.filepath)) {
//     try {
//       await fs.promises.unlink(oldImage.filepath);
//     } catch (err) {
//       return next(new CustomError(500, "Failed to delete the current image"));
//     }
//   }

//   // Remove the image from the CSR's images array
//   csr.images.splice(imageIndex, 1);
//   await csr.save();

//   res.status(200).json({
//     code: 200,
//     status: "success",
//     message: "Image deleted successfully.",
//     data: {
//       CSR: csr,
//     },
//   });
// });

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
