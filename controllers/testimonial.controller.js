import Testimonial from "../models/testimonial.model.js";
import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import fs from "fs";

export const createTestimonial = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError(400, "No image to upload for profile"));
  }

  const { filename, path: filepath } = req.file;
  const domainName = req.user.domainName;
  const { name, body, company, rank } = req.body;
  if (!name || !body) {
    return next(new CustomError(400, "Please filled all the required field"));
  }

  const newTestimonial = new Testimonial({
    profile: {
      filename,
      filepath,
    },
    domainName,
    name,
    body,
    company,
    rank,
  });

  const savedTestimonial = await newTestimonial.save();
  const { __v, createdAt, ...rest } = savedTestimonial._doc;
  res.status(201).json({
    code: 201,
    status: "success",
    message: "Testimonial created successfully.",
    data: {
      testimonial: rest,
    },
  });
});

export const publicTestimonial = asyncErrorHandler(async (req, res, next) => {
  const { domainName } = req;
  if (!domainName) {
    return next(new CustomError(400, "Domain name not found."));
  }
  const testimonials = await Testimonial.find({ domainName });

  if (testimonials.length === 0) {
    return next(new CustomError(404, "No Testimonials found for this domain."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      testimonials,
    },
  });
});

export const cmsTestimonial = asyncErrorHandler(async (req, res, next) => {
  const domainName = req.user.domainName;

  if (!domainName) {
    return next(
      new CustomError(400, "Domain name not found for the authenticated user.")
    );
  }

  // Fetch banners for the domain
  const testimonials = await Testimonial.find({ domainName });

  if (testimonials.length === 0) {
    return next(new CustomError(404, "No Testimonial found for this domain."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      testimonials,
    },
  });
});

export const testimonialUpdate = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { domainName } = req.user;

  // Find the current testimonial based on ID and domain name
  const currentTestimonial = await Testimonial.findOne({ _id: id, domainName });

  if (!currentTestimonial) {
    return next(
      new CustomError(404, "Testimonial not found or not authorized to update")
    );
  }

  let updateData = {};

  // If a new file is uploaded, handle the file update
  if (req.file) {
    try {
      // Check if the current file exists and remove it
      if (fs.existsSync(currentTestimonial.profile.filepath)) {
        await fs.promises.unlink(currentTestimonial.profile.filepath);
      } else {
        return next(new CustomError(404, "Current profile image not found"));
      }
    } catch (err) {
      return next(
        new CustomError(500, "Failed to delete the current profile image")
      );
    }

    // Add the new file information to the update data
    const { filename, path: filepath } = req.file;
    updateData.profile = { filename, filepath }; // Use `profile` field
  }

  // Add other fields to the update data if provided
  const { name, body, company, rank } = req.body;

  if (name || body || company || rank) {
    updateData = {
      ...updateData,
      ...(name && { name }),
      ...(body && { body }),
      ...(company && { company }),
      ...(rank && { rank }),
    };
  }

  // Perform the update operation
  const updatedTestimonial = await Testimonial.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedTestimonial) {
    return next(new CustomError(404, "Testimonial update failed"));
  }

  // Exclude fields you don't want to send in the response
  const { __v, createdAt, ...rest } = updatedTestimonial._doc;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Testimonial updated successfully",
    data: {
      updatedTestimonial: rest,
    },
  });
});

export const testimonialDelete = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const domainName = req.user.domainName;

  const testimonials = await Testimonial.findOneAndDelete({
    _id: id,
    domainName,
  });

  if (!testimonials) {
    return next(
      new CustomError(404, "Testimonials not found or not authorized to delete")
    );
  }

  try {
    if (fs.existsSync(testimonials.profile.filepath)) {
      await fs.promises.unlink(testimonials.profile.filepath);
    } else {
      return next(new CustomError(404, "Current image not found"));
    }
  } catch (err) {
    return next(new CustomError(500, "Failed to delete the current image"));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Testimonials deleted successfully",
  });
});

//Database Roll Backs
// import mongoose from "mongoose";
// import fs from "fs/promises";

// export const testimonialDelete = asyncErrorHandler(async (req, res, next) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const domainName = req.user.domainName;

//     // Find and delete testimonial
//     const testimonials = await Testimonial.findOneAndDelete({
//       _id: id,
//       domainName,
//     }).session(session);

//     if (!testimonials) {
//       await session.abortTransaction();
//       session.endSession();
//       return next(
//         new CustomError(
//           404,
//           "Testimonials not found or not authorized to delete"
//         )
//       );
//     }

//     // Delete the image associated with the testimonial
//     try {
//       if (fs.existsSync(testimonials.profile.filepath)) {
//         await fs.unlink(testimonials.profile.filepath);
//       } else {
//         await session.abortTransaction();
//         session.endSession();
//         return next(new CustomError(404, "Current image not found"));
//       }
//     } catch (err) {
//       await session.abortTransaction();
//       session.endSession();
//       return next(new CustomError(500, "Failed to delete the current image"));
//     }

//     // Commit the transaction
//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       code: 200,
//       status: "success",
//       message: "Testimonials deleted successfully",
//     });
//   } catch (err) {
//     // Rollback on failure
//     await session.abortTransaction();
//     session.endSession();
//     return next(new CustomError(500, "Failed to delete the testimonial"));
//   }
// });
