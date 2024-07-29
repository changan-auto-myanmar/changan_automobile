import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

export const signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const token = signToken(newUser._id);
  const { password: pass, __v, ...rest } = newUser._doc;

  res.status(201).json({
    statusCode: 201,
    status: "success",
    message: "User created successfully.",
    data: { user: rest, token },
  });

  next();
});

export const login = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Check id email & password is present in request body
  if (!email || !password) {
    const error = new CustomError(
      400,
      "Please provid Email ID & Password for login!"
    );
    return next(error);
  }

  //Check if user exit in db
  const user = await User.findOne({ email }).select("+password");

  //Checked the user exit & password matches
  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    const error = new CustomError(400, "Incorrect email or password");
    return next(error);
  }

  const token = signToken(user._id);
  const { password: pass, __v, ...rest } = user._doc;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "User successfully sign in.",
    data: {
      user: rest,
      token,
    },
  });
});
