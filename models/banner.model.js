import mongoose from "mongoose";

const Schema = mongoose.Schema;
const bannerSchema = new Schema({
  bannerImageUrl: {
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
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;
