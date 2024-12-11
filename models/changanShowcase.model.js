import mongoose from "mongoose";

const Schema = mongoose.Schema;

const FileSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  filepath: {
    type: String,
    required: true,
  },
});

const CarColorSchema = new Schema({
  car_image: {
    type: FileSchema,
    required: true,
  },
  car_color: {
    type: FileSchema,
    required: true,
  },
  color_name: {
    type: String,
    required: true,
  },
});

// Main schema for Changan Showcase
const changanShowcaseSchema = new Schema({
  // Stage-1 (Car Mock-up)
  car_brand: {
    type: String,
    enum: ["CHANGAN AUTO", "DEEPAL", "KAICHENG"],
    required: true,
  },
  car_name: {
    type: String,
    required: true,
  },
  mockup: {
    type: FileSchema,
    required: true,
  },
  car_banner: {
    type: FileSchema,
    required: true,
  },
  car_slogan: {
    type: String,
    // required: true,
  },
  car_porche: {
    type: FileSchema,
    required: true,
  },
  car_exterior: {
    type: [FileSchema],
    required: false,
  },
  car_interior: {
    type: [FileSchema],
    required: false,
  },
  gallery: {
    type: [FileSchema],
    required: false,
  },

  car_color: {
    type: [CarColorSchema],
    required: false,
  },
});

const changanShowcase = mongoose.model(
  "ChanganShowcase",
  changanShowcaseSchema
);

export default changanShowcase;
