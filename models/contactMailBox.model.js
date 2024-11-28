import mongoose from "mongoose";

const contactMailBoxSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
  },
  select_car: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

const contactMailBox = mongoose.model("mailbox", contactMailBoxSchema);

export default contactMailBox;
