import User from "../models/user.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import { signToken } from "./auth.controller.js";

const filterReqObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((prop) => {
    if (allowedFields.includes(prop)) newObj[prop] = obj[prop];
  });
  return newObj;
};

export const getAllUser = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find();

  if (users.length !== 0) {
    res.status(200).json({
      code: 200,
      status: "success",
      message: "Successfully fetch user data.",
      result: users.length,
      data: {
        users,
      },
    });
  } else {
    res.status(200).json({
      code: 200,
      status: "success",
      message: "Successfully fetch user data.No inactive user.",
      result: users.length,
    });
  }
});

export const updatePassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  if (req.body.email || req.body.domainName || req.body.role) {
    return next(new CustomError(400, "Invalid data input"));
  }

  if (
    !(await user.comparePasswordInDb(req.body.currentPassword, user.password))
  ) {
    return next(new CustomError(400, "Incorrect Password"));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  const {
    password: pass,
    __v,
    role,
    email,
    domainName,
    createdAt,
    ...rest
  } = user._doc;

  const token = signToken(user._id);
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Password Updated successfully",
    data: {
      user: rest,
      token,
    },
  });
});

export const updateUserData = asyncErrorHandler(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword || req.body.role) {
    let fields = [];
    if (req.body.password) fields.push("password");
    if (req.body.confirmPassword) fields.push("confirmPassword");
    if (req.body.role) fields.push("role");

    return next(
      new CustomError(
        400,
        `You can't update the following fields with this API: ${fields.join(
          ", "
        )}`
      )
    );
  }

  const filterObj = filterReqObj(req.body, "domainName", "email");
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
    runValidators: true,
    new: true,
  });
  const {
    password: pass,
    __v,
    role,
    passwordChangedAt,
    createdAt,
    _id,
    ...rest
  } = updatedUser._doc;

  res.status(200).json({
    code: 200,
    status: "success",
    message: "User Data successfully updated",
    data: {
      user: rest,
    },
  });
});

export const deactivate = asyncErrorHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    code: 204,
    status: "success",
    message: "User account have been deactivated successfully.",
  });
});
