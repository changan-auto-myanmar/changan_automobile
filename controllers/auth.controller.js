import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const signInToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

export const signup = async (req, res, next) => {
  const newUser = await User.create(req.body);

  const token = signInToken(newUser._id);

  res.status(201).json({
    statusCode: 201,
    status: "success",
    message: "User created successfully.",
    data: { user: newUser, token },
  });

  next();
};
