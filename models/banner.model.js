import mongoose from "mongoose";

const Schema = mongoose.Schema;
const bannerSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;
