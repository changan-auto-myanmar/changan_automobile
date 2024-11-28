import contactMailBox from "../models/contactMailBox.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

export const formSubmit = asyncErrorHandler(async (req, res, next) => {
  const { name, email, phone, subject, select_car, description } = req.body;

  if (!name || !email || !phone || !select_car || !description) {
    return next(new CustomError(400, "Please Provide Require Data!"));
  }

  const existingSubmission = await contactMailBox.findOne({
    name,
    email,
    phone,
    subject,
    select_car,
    description,
  });
  if (existingSubmission) {
    return next(new CustomError(400, "This submission already recieved"));
  }

  const savedSubmitForm = await contactMailBox.create({
    name,
    email,
    phone,
    subject,
    select_car,
    description,
  });

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Your form is submitted successfully.",
    data: {
      submittedForm: savedSubmitForm,
    },
  });
});

export const getAllforms = asyncErrorHandler(async (req, res, next) => {
  const { sortBy } = req.query;
  let sortQuery = { sentAt: -1 };

  if (sortBy === "oldest") {
    sortQuery = { sentAt: 1 };
  }

  const submissions = await contactMailBox.find().sort(sortQuery);
  res.status(200).json({
    code: 200,
    status: "success",
    messgae: "Successfully retrive all of the mail.",
    data: {
      mailbox: submissions,
    },
  });
});

export const submittedForm = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new CustomError(400, "From id is required"));
  }

  const submissions = await contactMailBox.findById(id);

  if (!submissions) {
    return next(new CustomError(400, "There is no form with the given id."));
  }
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Successfully retrived a form data.",
    data: {
      mail: submissions,
    },
  });
});

export const deleteform = asyncErrorHandler(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return next(new CustomError(400, "IDs array is required"));
  }

  const deleteSubmissions = await contactMailBox.deleteMany({
    _id: { $in: ids },
  });

  if (deleteSubmissions.deletedCount === 0) {
    return next(new CustomError(404, "There is no form with the provided Id."));
  }
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Successfully Deleted.",
  });
});
