import mongoose from "mongoose";

const Schema = mongoose.Schema;
const companyLogo = new Schema({
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

const CompanyLogo = mongoose.model("companylogo", companyLogo);
export default CompanyLogo;
