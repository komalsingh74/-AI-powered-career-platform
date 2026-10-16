import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN", "CONSULTANT"],
      default: "USER",
    },

    profile: {
      headline: { type: String, default: "" },
      location: { type: String, default: "" },
      skills: { type: [String], default: [] },
      experienceYears: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

export default User;
