import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CompanyLogo from "../models/companyLogo.model.js";
import fs from "fs";

export const companyLogoUpload = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError(400, "No Image to upload"));
  }
  const { filename, path: filepath } = req.file;
  const domainName = req.user.domainName;
  const newCompanyLogo = new CompanyLogo({ filename, filepath, domainName });
  const savedCompanyLogo = await newCompanyLogo.save();
  const { __v, uploadDate, ...rest } = savedCompanyLogo._doc;
  res.status(201).json({
    code: 201,
    status: "success",
    message: "Company Logo Uploaded Successfully.",
    data: {
      savedCompanyLogo: rest,
    },
  });
});

export const publicCompanyLogo = asyncErrorHandler(async (req, res, next) => {
  const { domainName } = req;

  if (!domainName) {
    return next(new CustomError(400, "Domain name not found."));
  }
  const companyLogos = await CompanyLogo.find({ domainName });

  if (companyLogos.length === 0) {
    return next(new CustomError(404, "No Company Logo found for this domain."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      companyLogos,
    },
  });
});

export const cmsCompanyLogo = asyncErrorHandler(async (req, res, next) => {
  // Access domainName from the authenticated user's data
  const domainName = req.user.domainName;

  if (!domainName) {
    return next(
      new CustomError(400, "Domain name not found for the authenticated user.")
    );
  }

  // Fetch banners for the domain
  const companyLogos = await CompanyLogo.find({ domainName });

  if (companyLogos.length === 0) {
    return next(new CustomError(404, "No company logo found for this domain."));
  }

  res.status(200).json({
    code: 200,
    status: "success",
    data: {
      companyLogos,
    },
  });
});

export const CompanyLogoUpdate = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { domainName } = req.user;

  // Find the banner by ID and domainName
  const currentCompanyLogo = await CompanyLogo.findOne({ _id: id, domainName });
  if (!currentCompanyLogo) {
    return next(
      new CustomError(404, "Company Logo not found or not authorized to update")
    );
  }
  const { filename, path: filepath } = req.file;
  // Delete the old image file from the file system
  fs.unlinkSync(currentCompanyLogo.filepath);

  // Save the new image file to the file system

  // Update the banner with new image details
  const updatedCompanyLogo = await CompanyLogo.findByIdAndUpdate(
    id,
    { filename, filepath },
    { new: true }
  );

  if (!updatedCompanyLogo) {
    return next(new CustomError(404, "Company Logo update failed"));
  }
  const { __v, uploadDate, ...rest } = updatedCompanyLogo._doc;
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Company Logo Image updated successfully",
    data: {
      updatedCompanyLogo: rest,
    },
  });
});

export const CompanyLogoDelete = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const domainName = req.user.domainName;

  const companyLogos = await CompanyLogo.findOneAndDelete({
    _id: id,
    domainName,
  });

  if (!companyLogos) {
    return next(
      new CustomError(404, "Banner not found or not authorized to delete")
    );
  }

  fs.unlinkSync(companyLogos.filepath);

  res.status(200).json({
    code: 200,
    status: "success",
    message: "Banner deleted successfully",
  });
});
