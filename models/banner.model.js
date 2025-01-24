import mongoose from "mongoose";

const Schema = mongoose.Schema;
const bannerSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  filepath: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;
