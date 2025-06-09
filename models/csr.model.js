import mongoose from "mongoose";

const Schema = mongoose.Schema;

const csrImagesSchema = new Schema({
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

const csrSchema = new Schema({
  category: {
    type: String,
    enum: ["Events", "Promotions", "News"],
    required: true,
  },

  title: { type: String, required: true, trim: true },

  csrImages: [csrImagesSchema],

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

  textBody: { type: String, required: true, trim: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
});

const CSR = mongoose.model("Csr", csrSchema);

export default CSR;
