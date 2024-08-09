import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
const domainExtracter = asyncErrorHandler(async (req, res, next) => {
  const refererHeader = req.headers.referer || req.headers.origin;

  if (!refererHeader) {
    return next(new CustomError(400, "Referer or Origin header is missing"));
  }

  // Extract the domain from the Referer or Origin header
  const domainName = new URL(refererHeader).hostname;

  if (!domainName) {
    return next(new CustomError(400, "Domain name extraction failed"));
  }

  req.domainName = domainName;
  next();
});

export default domainExtracter;
