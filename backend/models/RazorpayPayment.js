import mongoose from "mongoose";

const razorpayPaymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, default: "", index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, lowercase: true },
    status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
  },
  { timestamps: true },
);

const RazorpayPayment = mongoose.models.RazorpayPayment || mongoose.model("RazorpayPayment", razorpayPaymentSchema);
export default RazorpayPayment;
