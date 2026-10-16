import mongoose from "mongoose";

const stripeEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    status: {
      type: String,
      enum: ["RECEIVED", "PROCESSING", "PROCESSED", "FAILED"],
      default: "RECEIVED",
    },
    lastError: { type: String, default: "" },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const StripeEvent =
  mongoose.models.StripeEvent ||
  mongoose.model("StripeEvent", stripeEventSchema);

export default StripeEvent;
