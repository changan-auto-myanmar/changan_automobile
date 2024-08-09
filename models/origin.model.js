import mongoose from "mongoose";

const Schema = mongoose.Schema;
const originSchema = new Schema({
  origins: [
    {
      origin: {
        type: String,
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
        required: true,
      },
    },
  ],
});

const Origin = mongoose.model("origin", originSchema);
export default Origin;
