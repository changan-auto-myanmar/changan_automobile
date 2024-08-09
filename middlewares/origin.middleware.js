import cors from "cors";
import Origin from "../models/origin.model.js";
import CustomError from "../utils/customError.js";

const dynamicCors = async (req, res, next) => {
  try {
    const originDoc = await Origin.findOne();
    if (!originDoc) {
      return next(new Error("No origins found in the database"));
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const validOrigins = originDoc.origins
      .filter((o) => new Date(o.addedAt) > oneMonthAgo)
      .map((o) => o.origin);

    cors({
      origin: (origin, callback) => {
        if (validOrigins.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = dynamicCors;
