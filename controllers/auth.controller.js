import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import utli from "util";

export const signToken = (id) => {
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
});

export const login = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new CustomError(
      400,
      "Please provide correct Email ID & Password for login!"
    );
    return next(error);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    const error = new CustomError(400, "Incorrect email or password");
    return next(error);
  }

  const token = signToken(user._id);
  const {
    password: pass,
    __v,
    passwordResetToken,
    passwordResetTokenExpire,
    ...rest
  } = user._doc;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "User successfully log in.",
    data: {
      user: rest,
      token,
    },
  });
});

export const protect = asyncErrorHandler(async (req, res, next) => {
  const testToken = req.headers.authorization;
  let token;
  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }
  if (!token) {
    next(
      new CustomError(401, "You are not logged in! Authentication required")
    );
  }
  const decodedToken = await utli.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR
  );
  const user = await User.findById(decodedToken.id);

  if (!user) {
    const error = new CustomError(401, "The User does not exist");
    next(error);
  }
  req.user = user;
  next();
});

export const restrict = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      const error = new CustomError(403, "Forbidden Access");
      return next(error);
    }
    next();
  };
};
