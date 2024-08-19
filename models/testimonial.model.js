import mongoose from "mongoose";

const Schema = mongoose.Schema;

const testimonialSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  company: {
    type: String,
  },
  rank: {
    type: String,
  },
  body: {
    type: String,
    required: true,
  },
  profile: {
    filename: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
  },
  domainName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Testimonial = mongoose.model("testimonial", testimonialSchema);

export default Testimonial;
