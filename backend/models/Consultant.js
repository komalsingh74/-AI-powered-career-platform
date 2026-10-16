import mongoose from "mongoose";

function hasValidAvailabilityWindows(windows) {
  return Array.isArray(windows) && windows.every(({ startTime, endTime }) => {
    const start = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(startTime);
    const end = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(endTime);
    if (!start || !end) return false;
    const startMinutes = Number(start[1]) * 60 + Number(start[2]);
    const endMinutes = Number(end[1]) * 60 + Number(end[2]);
    return startMinutes < endMinutes;
  });
}

const consultantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    bio: { type: String, default: "", maxlength: 1200 },
    specialties: { type: [String], default: [] },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isInteger,
    },
    currency: {
      type: String,
      default: "inr",
      lowercase: true,
      match: /^[a-z]{3}$/,
    },
    timeZone: {
      type: String,
      default: "Asia/Kolkata",
      validate: {
        validator(value) {
          try {
            new Intl.DateTimeFormat("en", { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        message: "Consultant time zone must be a valid IANA time zone",
      },
    },
    slotDurationMinutes: {
      type: Number,
      default: 60,
      min: 15,
      validate: Number.isInteger,
    },
    availability: {
      type: [
        {
          dayOfWeek: { type: Number, min: 0, max: 6, required: true },
          startTime: {
            type: String,
            required: true,
            match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
          },
          endTime: {
            type: String,
            required: true,
            match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
          },
        },
      ],
      default: [],
      validate: {
        validator: hasValidAvailabilityWindows,
        message: "Availability windows must have valid times and a positive duration",
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

consultantSchema.index({ active: 1, name: 1 });

const Consultant =
  mongoose.models.Consultant ||
  mongoose.model("Consultant", consultantSchema);

export default Consultant;
