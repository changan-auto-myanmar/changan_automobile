import mongoose from "mongoose";

const Schema = mongoose.Schema;

const csrSchema = new Schema({
  domainName: {
    type: String,
    required: true,
  },
  textBody: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["Events", "Promotions", "News"],
    required: true,
  },
  images: [
    {
      filename: { type: String, required: true },
      filepath: { type: String, required: true },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CSR = mongoose.model("csr", csrSchema);

export default CSR;
