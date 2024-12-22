import mongoose from "mongoose";

const { Schema } = mongoose;

const csrSchema = new Schema({
  domainName: { type: String, required: true, trim: true, index: true },

  category: {
    type: String,
    enum: ["Events", "Promotions", "News"],
    required: true,
  },

  title: { type: String, required: true, trim: true },

  images: [
    {
      filename: { type: String, required: true },
      filepath: { type: String, required: true },
    },
  ],

  eventDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !(this.category === "News" && value);
      },
      message: (props) =>
        `Event Date should not be provided when category is 'News'. Provided value: ${props.value}`,
    },
  },

  body: { type: String, required: true, trim: true },

  createdAt: { type: Date, default: Date.now },
});

const CSR = mongoose.model("CSR", csrSchema);

export default CSR;
