import CustomError from "../utils/customError.js";
import multer from "multer";

// Error handling for different types of errors
const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    code: error.statusCode,
    status: error.status,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const castErrorHandler = (err) => {
  const message = `Invalid value for ${err.path}: ${err.value}!`;
  return new CustomError(400, message);
};

const duplicateKeyErrorHandler = (err) => {
  const name = err.keyValue.domainName || err.keyValue.email;
  const message = `Already existed ${name}`;
  return new CustomError(400, message);
};

const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join(". ");
  const msg = `Invalid input data: ${errorMessages}`;
  return new CustomError(400, msg);
};

const handleExpiredJWT = (err) => {
  return new CustomError(401, "JWT has expired. Please log in again.");
};

const handleJWTError = (err) => {
  return new CustomError(401, "Invalid token. Please log in again.");
};

// Custom handler for Multer errors
const multerErrorHandler = (err) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_COUNT") {
      return new CustomError(
        400,
        "Too many files uploaded. Maximum allowed is 10."
      );
    } else if (err.code === "LIMIT_FILE_SIZE") {
      return new CustomError(
        400,
        `File too large. Maximum allowed size is 10Mb per file.`
      );
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return new CustomError(400, "Unexpected field");
    }
    return new CustomError(400, err.message);
  }
  return new CustomError(500, "An unexpected error occurred");
};

const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      code: error.statusCode,
      status: error.status,
      message: error.message,
    });
  } else {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

// Global error handler
export const globalErrorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "fail";
  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "CastError") error = castErrorHandler(error);
    if (error.code === 11000) error = duplicateKeyErrorHandler(error);
    if (error.name === "ValidationError") error = validationErrorHandler(error);
    if (error.name === "TokenExpiredError") error = handleExpiredJWT(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);
    if (error instanceof multer.MulterError) error = multerErrorHandler(error);
    prodErrors(res, error);
  }
};

export default globalErrorHandler;
