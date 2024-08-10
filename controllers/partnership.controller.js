import Partnership from "../models/partnership.model.js";
import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import fs from "fs";

export const partnershipUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError(400, "No Image to Upload"));
  }

  const { filename, path: filepath } = req.file;
  const domainName = req.user.domainName;
  const { url } = req.body;
  const newPartnership = new Partnership({
    filename,
    filepath,
    domainName,
    url,
  });
  const savedPartnership = await newPartnership.save();
  const { __v, uploadDate, ...rest } = savedPartnership._doc;
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Partnership Uploaded successfully.",
    data: {
      partnership: rest,
    },
  });
});

export const partnershipPublic = asyncErrorHandler(async (req, res, next) => {
  const { domainName } = req;

  if (!domainName) {
    return next(new CustomError(400, "Domain name not found."));
  }
  const partnerships = await Partnership.find({ domainName });

  if (partnerships.length === 0) {
    return next(
      new CustomError(404, "No partnership Logo found for this domain.")
    );
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      partnerships,
    },
  });
});

export const partnershipCms = asyncErrorHandler(async (req, res, next) => {
  const domainName = req.user.domainName;

  if (!domainName) {
    return next(
      new CustomError(400, "Domain name not found for the authenticated user.")
    );
  }

  // Fetch banners for the domain
  const partnerships = await Partnership.find({ domainName });

  if (partnerships.length === 0) {
    return next(
      new CustomError(404, "No partnership logos found for this domain.")
    );
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      partnerships,
    },
  });
});

export const partnershipUpdate = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { domainName } = req.user;

  // Find the banner by ID and domainName
  const currentPartnership = await Partnership.findOne({ _id: id, domainName });
  if (!currentPartnership) {
    return next(
      new CustomError(404, "Partnership not found or not authorized to update")
    );
  }
  if (!req.file) {
    return next(new CustomError(400, "No image is selected to update"));
  } else {
    try {
      if (fs.existsSync(currentPartnership.filepath)) {
        await fs.promises.unlink(currentPartnership.filepath);
      } else {
        return next(new CustomError(404, "Current image not found"));
      }
    } catch (err) {
      return next(new CustomError(500, "Failed to delete the current image"));
    }
  }
  const { filename, path: filepath } = req.file;

  const { url } = req.body;

  const updatedPartnership = await Partnership.findByIdAndUpdate(
    id,
    { filename, filepath, url },
    { new: true }
  );

  if (!updatedPartnership) {
    return next(new CustomError(404, "Partnership update failed"));
  }
  const { __v, uploadDate, ...rest } = updatedPartnership._doc;
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Partnership updated successfully",
    data: {
      updatedPartnership: rest,
    },
  });
});

export const partnershipDelete = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const domainName = req.user.domainName;

  const partnerships = await Partnership.findOneAndDelete({
    _id: id,
    domainName,
  });

  if (!partnerships) {
    return next(
      new CustomError(404, "Partnerships not found or not authorized to delete")
    );
  }

  try {
    if (fs.existsSync(partnerships.filepath)) {
      await fs.promises.unlink(partnerships.filepath);
    } else {
      return next(new CustomError(404, "Current image not found"));
    }
  } catch (err) {
    return next(new CustomError(500, "Failed to delete the current image"));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Partnerships deleted successfully",
  });
});
