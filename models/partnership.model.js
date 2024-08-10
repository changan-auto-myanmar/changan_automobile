import mongoose from "mongoose";

const Schema = mongoose.Schema;
const partnershipSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  filepath: {
    type: String,
    required: true,
  },
  url: {
    type: String,
  },
  domainName: {
    type: String,
    required: true,
  },
});

const Partnership = mongoose.model("partnership", partnershipSchema);

export default Partnership;
