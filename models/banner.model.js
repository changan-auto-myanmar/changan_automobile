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
  domainName: {
    type: String,
    required: true,
  },
});

const Banner = mongoose.model("banner", bannerSchema);
export default Banner;
