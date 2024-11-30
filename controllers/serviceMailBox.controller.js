import serviceMailBox from "../models/serviceMailBox.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

export const formSubmit = asyncErrorHandler(async (req, res, next) => {
  const { name, email, phone, car_model, date } = req.body;

  if (!name || !email || !phone || !car_model || !date) {
    return next(new CustomError(400, "Please Provide Require Data!"));
  }

  const existingSubmission = await serviceMailBox.findOne({
    name,
    email,
    phone,
    car_model,
    date,
  });
  if (existingSubmission) {
    return next(new CustomError(400, "This submission already recieved"));
  }

  const savedSubmitForm = await serviceMailBox.create({
    name,
    email,
    phone,
    car_model,
    date,
  });

  res.status(201).json({
    code: 201,
    status: "success",
    message: "Your service form is submitted successfully.",
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

  const submissions = await serviceMailBox.find().sort(sortQuery);
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
    return next(new CustomError(400, "Service from id is required"));
  }

  const submissions = await serviceMailBox.findById(id);

  if (!submissions) {
    return next(
      new CustomError(400, "There is no service form with the given id.")
    );
  }
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Successfully retrived a service form data.",
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

  const deleteSubmissions = await serviceMailBox.deleteMany({
    _id: { $in: ids },
  });

  if (deleteSubmissions.deletedCount === 0) {
    return next(
      new CustomError(404, "There is no service form with the provided Id.")
    );
  }
  res.status(200).json({
    code: 200,
    status: "success",
    message: "Successfully Deleted.",
  });
});
