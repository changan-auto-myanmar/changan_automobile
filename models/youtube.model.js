import mongoose from "mongoose";

const Schema = mongoose.Schema;

const youtubeVideoSchema = new Schema({
  video_id: {
    type: String,
    required: true,
  },
});

const youtubeVideo = mongoose.model("Youtube", youtubeVideoSchema);

export default youtubeVideo;
