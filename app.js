import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import sanitize from "express-mongo-sanitize";
import xss from "xss-clean";

// User Define Module
import CustomError from "./utils/customError.js";
import bannerRouter from "./routes/banner.route.js";
import globalErrorHandler from "./controllers/error.controller.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import videoBannerRouter from "./routes/videoBanner.route.js";
import csrRouter from "./routes/csr.route.js";
import companyLogoRouter from "./routes/companyLogo.route.js";
import partnershipRouter from "./routes/partnership.route.js";
import setupSwagger from "./configs/swagger.config.js";

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

let limiter = rateLimit({
  max: 60,
  windowMs: 60 * 1000,
  handler: (req, res) => {
    res.status(429).json({
      code: 429,
      status: "fail",
      message: "Too many requests. Please try again later",
    });
  },
});

app.use("/api", limiter);

app.use(
  cors({
    origin: "*",
    // origin: [
    //   "http://localhost:5173",
    //   "https://changan-auto-myanmar.netlify.app",
    // ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10kb" }));
app.use(sanitize());
app.use(xss());
app.use(express.json());
app.use("/api/v1/public", express.static("public"));
app.use("/api/v1/videos", express.static("videos"));
//Route Mounting
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1", bannerRouter);
app.use("/api/v1", videoBannerRouter);
app.use("/api/v1", companyLogoRouter);
app.use("/api/v1", partnershipRouter);
app.use("/api/v1", csrRouter);

setupSwagger(app);
//404-Error Handler
app.all("*", (req, res, next) => {
  const err = new CustomError(
    404,
    `Can't find ${req.originalUrl} on the server!`
  );
  next(err);
});

app.use(globalErrorHandler);

export default app;
