import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import express from "express";
import cors from "cors";

// User Define Module
import CustomError from "./utils/customError.js";
import globalErrorHandler from "./controllers/error.controller.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import setupSwagger from "./configs/swagger.config.js";
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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Route Mounting
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

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
