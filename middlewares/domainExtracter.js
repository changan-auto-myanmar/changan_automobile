import CustomError from "../utils/customError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
const domainExtracter = asyncErrorHandler(async (req, res, next) => {
  const hostHeader = req.headers.host;
  if (!hostHeader) {
    return next(new CustomError(400, "Host header is missing"));
  }

  const domainName = await hostHeader.split(":")[0]; // In case port number is included
  if (!domainName) {
    return next(new CustomError(400, "Domain name extraction failed"));
  }

  req.domainName = domainName;
  next();
});

export default domainExtracter;
