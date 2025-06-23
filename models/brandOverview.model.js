import mongoose from "mongoose";

const Schema = mongoose.Schema;

const brandImageSchema = new Schema({
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

const brandOverviewSchema = new Schema({
  car_brand: {
    type: String,
    enum: ["CHANGAN", "DEEPAL", "KAICHENG"],
    required: true,
    unique: true,
  },
  brandImageUrls: [brandImageSchema],
});

const brandOverview = mongoose.model("BrandOverview", brandOverviewSchema);
export default brandOverview;
