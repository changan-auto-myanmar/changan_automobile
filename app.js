import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import express from "express";
import cors from "cors";
import morgan from "morgan";

// User Define Module
import CustomError from "./utils/customError.js";
import bannerRouter from "./routes/banner.route.js";
import globalErrorHandler from "./controllers/error.controller.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://changan-auto-myanmar.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/v1", express.static("public/banner"), bannerRouter);
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
