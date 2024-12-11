import mongoose from "mongoose";

const Schema = mongoose.Schema;

const csrSchema = new Schema({
  domainName: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    enum: ["Events", "Promotions", "News"],
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  image: {
    filename: { type: String, required: true },
    filepath: { type: String, required: true },
  },

  eventDate: {
    type: Date,
    validate: {
      validator: function (value) {
        // If the category is 'News', eventDate should be null or undefined
        return !(this.category === "News" && value);
      },
      message: "eventDate should not be provided when category is 'News'.",
    },
  },

  sub_title: {
    type: String,
    required: true,
  },

  body: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CSR = mongoose.model("csr", csrSchema);

export default CSR;
