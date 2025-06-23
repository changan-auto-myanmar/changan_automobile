import mongoose from "mongoose";

const Schema = mongoose.Schema;

const FileUploadSchema = new Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  url: {
    type: String,
    required: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
  },
});

const CarColorSchema = new Schema({
  car_color_image: {
    type: FileUploadSchema,
    required: true,
  },
  car_color_swatches: {
    type: FileUploadSchema,
    required: true,
  },
  color_name: {
    type: String,
    required: true,
  },
});

const changanShowcaseSchema = new Schema({
  car_brand: {
    type: String,
    enum: ["CHANGAN", "DEEPAL", "KAICHENG"],
    required: true,
  },
  car_name: {
    type: String,
    required: true,
  },
  mockup: {
    type: FileUploadSchema,
    required: false,
  },
  car_banner: {
    type: FileUploadSchema,
    required: false,
  },
  car_slogan: {
    type: String,
  },
  car_brochure: {
    type: FileUploadSchema,
    required: false,
  },
  car_exterior: {
    type: [FileUploadSchema],
    required: false,
  },
  car_interior: {
    type: [FileUploadSchema],
    required: false,
  },
  gallery: {
    type: [FileUploadSchema],
    required: false,
  },

  car_color: {
    type: [CarColorSchema],
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

const ChanganShowcase = mongoose.model(
  "ChanganShowcase",
  changanShowcaseSchema
);

export default ChanganShowcase;
