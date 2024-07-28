import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import express from "express";
import cors from "cors";
import morgan from "morgan";

// User Define Module
import CustomError from "./utils/customError.js";
import globalErrorHandler from "./controllers/error.controller.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/test", (req, res) => {
  res.send("Test route is working!");
});
//404-Error Handler
app.all("*", (req, res, next) => {
  const err = new CustomError(
    404,
    `Can't find ${req.originalUrl} on the server!`
  );
  next(err);
});

// app.use(globalErrorHandler);

export default app;
