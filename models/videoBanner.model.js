import mongoose from "mongoose";

const Schema = mongoose.Schema;
const videoBannerSchema = new Schema({
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

const VideoBanner = mongoose.model("video_banner", videoBannerSchema);
export default VideoBanner;
