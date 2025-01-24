import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

const Schema = mongoose.Schema;
const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please Enter Valid Email."],
  },
  password: {
    type: String,
    required: [true, "Please Enter a Password."],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please Confirm your Password."],
    validate: {
      validator: function (val) {
        return val == this.password;
      },
      message: "Password Doesn't Match.",
    },
  },
  role: {
    type: String,
    enum: ["admin", "superadmin"],
    default: "admin",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  passwordChangedAt: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetTokenExpire: { type: Date, select: false },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePasswordInDb = async (pswd, pswdDB) => {
  return await bcrypt.compare(pswd, pswdDB);
};

const User = mongoose.model("User", userSchema);

export default User;
