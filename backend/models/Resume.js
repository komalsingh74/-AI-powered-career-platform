import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, trim: true, required: true, maxlength: 100 },
    template: {
      type: String,
      enum: ["MODERN", "ATS_CLASSIC"],
      default: "MODERN",
    },
    content: {
      personalInformation: {
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        location: { type: String, default: "" },
        headline: { type: String, default: "" },
        links: { type: [String], default: [] },
      },
      summary: { type: String, default: "" },
      education: { type: [mongoose.Schema.Types.Mixed], default: [] },
      experience: { type: [mongoose.Schema.Types.Mixed], default: [] },
      skills: { type: [String], default: [] },
      projects: { type: [mongoose.Schema.Types.Mixed], default: [] },
      certifications: { type: [mongoose.Schema.Types.Mixed], default: [] },
      achievements: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, updatedAt: -1 });

const Resume =
  mongoose.models.Resume || mongoose.model("Resume", resumeSchema);

export default Resume;
