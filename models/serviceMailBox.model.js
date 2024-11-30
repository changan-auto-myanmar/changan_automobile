import mongoose from "mongoose";

const serviceMailBoxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  car_model: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

const serviceMailBox = mongoose.model("ServiceMailBox", serviceMailBoxSchema);

export default serviceMailBox;
