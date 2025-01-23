import Banner from "../models/banner.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import fs from "fs";
import path from "path";

export const bannerUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError(400, "No Image to upload"));
  }
  const { filename, path: filepath } = req.file;
  // const domainName = req.user.domainName;
  // const newBanner = new Banner({ filename, filepath, domainName });
  const newBanner = new Banner({ filename, filepath });
  const savedBanner = await newBanner.save();
  const { __v, uploadDate, ...rest } = savedBanner._doc;
  res.status(201).json({
    code: 201,
    status: "success",
    message: "Banner Image Uploaded Successfully.",
    data: {
      banner: rest,
    },
  });
});

// export const publicBanner = asyncErrorHandler(async (req, res, next) => {
//   const { domainName } = req;

//   if (!domainName) {
//     return next(new CustomError(400, "Domain name not found."));
//   }

//   const banners = await Banner.find({});

//   res.status(200).json({
//     code: 200,
//     status: "success",
//     data: {
//       banners,
//     },
//   });
// });

// export const cmsBanner = asyncErrorHandler(async (req, res, next) => {
//   const domainName = req.user.domainName;

//   if (!domainName) {
//     return next(
//       new CustomError(400, "Domain name not found for the authenticated user.")
//     );
//   }

//   const banners = await Banner.find({ domainName });

//   res.status(200).json({
//     code: 200,
//     status: "success",
//     data: {
//       banners,
//     },
//   });
// });

export const publicBanner = asyncErrorHandler(async (req, res, next) => {
  const banners = await Banner.find({});

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      banners,
    },
  });
});

export const updateBanner = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const currentBanner = await Banner.findOne({ _id: id });
  if (!currentBanner) {
    return next(
      new CustomError(404, "Banner not found or not authorized to update")
    );
  }
  // Delete the old image file from the file system
  if (!req.file) {
    return next(new CustomError(400, "No image is selected to update"));
  } else {
    try {
      if (fs.existsSync(currentBanner.filepath)) {
        await fs.promises.unlink(currentBanner.filepath);
      } else {
        return next(new CustomError(404, "Current image not found"));
      }
    } catch (err) {
      return next(new CustomError(500, "Failed to delete the current image"));
    }
  }
  const { filename, path: filepath } = req.file;

  const updatedBanner = await Banner.findByIdAndUpdate(
    id,
    { filename, filepath },
    { new: true }
  );

  if (!updatedBanner) {
    return next(new CustomError(404, "Banner update failed"));
  }
  const { __v, uploadDate, ...rest } = updatedBanner._doc;
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner Image updated successfully",
    data: {
      updatedBanner: rest,
    },
  });
});

export const bannerDelete = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const banners = await Banner.findOneAndDelete({ _id: id });

  if (!banners) {
    return next(
      new CustomError(404, "Banner not found or not authorized to delete")
    );
  }
  try {
    if (fs.existsSync(banners.filepath)) {
      await fs.promises.unlink(banners.filepath);
    } else {
      return next(new CustomError(404, "Current image not found"));
    }
  } catch (err) {
    return next(new CustomError(500, "Failed to delete the current image"));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner deleted successfully",
  });
});
