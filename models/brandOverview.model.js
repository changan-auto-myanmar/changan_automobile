import mongoose from "mongoose";

const Schema = mongoose.Schema;

const brandOverviewSchema = new Schema({
  car_brand: {
    type: String,
    enum: ["CHANGAN", "DEEPAL", "KAICHEN"],
    required: true,
  },
  images: [
    {
      filename: { type: String, required: true },
      filepath: { type: String, required: true },
    },
  ],
});

const brandOverview = mongoose.model("BrandOverview", brandOverviewSchema);
export default brandOverview;
