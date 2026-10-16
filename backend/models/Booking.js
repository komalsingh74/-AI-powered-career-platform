import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    consultant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant",
      required: true,
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "", maxlength: 20 },
    agenda: { type: String, trim: true, default: "", maxlength: 1000 },
    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PAYMENT_FAILED",
        "PAID",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    paymentIntentId: { type: String, default: "" },
    checkoutSessionId: { type: String, default: "" },
    razorpayOrderId: { type: String, default: "", index: true },
    calendarEventId: { type: String, default: "" },
    meetingUrl: { type: String, default: "" },
    calendarStatus: {
      type: String,
      enum: ["PENDING", "CREATED", "FAILED", "UNCONFIGURED"],
      default: "PENDING",
    },
    notificationStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "UNCONFIGURED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, startAt: 1 });
bookingSchema.index(
  { consultant: 1, startAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["PENDING_PAYMENT", "PAID", "CONFIRMED"] },
    },
  }
);

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
