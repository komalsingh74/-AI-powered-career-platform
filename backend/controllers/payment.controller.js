import { createHmac, timingSafeEqual } from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { processRazorpayWebhook, processStripeEvent, verifyRazorpayPayment } from "../services/payment.service.js";

function verifyStripeSignature(rawBody, header, secret) {
  const parts = header.split(",").map((part) => part.split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts
    .filter(([key]) => key === "v1")
    .map(([, signature]) => signature);
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest();
  return signatures.some((signature) => {
    if (!/^[a-f\d]{64}$/i.test(signature)) return false;
    return timingSafeEqual(expected, Buffer.from(signature, "hex"));
  });
}

export const stripeWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.get("stripe-signature");
  if (!secret) {
    res.status(503).json({ success: false, message: "Payment webhook is not configured." });
    return;
  }
  if (!Buffer.isBuffer(req.body) || !signature || !verifyStripeSignature(req.body, signature, secret)) {
    res.status(400).json({ success: false, message: "Invalid payment webhook signature." });
    return;
  }

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    res.status(400).json({ success: false, message: "Invalid payment webhook payload." });
    return;
  }
  if (typeof event.id !== "string" || typeof event.type !== "string") {
    res.status(400).json({ success: false, message: "Invalid payment webhook event." });
    return;
  }

  await processStripeEvent(event);
  res.status(200).json({ success: true, received: true });
});

export const verifyRazorpayBookingPayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { orderId, paymentId, signature } = req.body || {};
  if (![bookingId, orderId, paymentId, signature].every((value) => typeof value === "string" && value.length > 0)) {
    res.status(400).json({ success: false, message: "Invalid Razorpay payment details." });
    return;
  }
  const booking = await verifyRazorpayPayment(req.user._id, { bookingId, orderId, paymentId, signature });
  res.status(200).json({ success: true, data: { booking } });
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.get("x-razorpay-signature");
  if (!secret) {
    res.status(503).json({ success: false, message: "Razorpay webhook is not configured." });
    return;
  }
  if (!Buffer.isBuffer(req.body) || !signature || !/^[a-f\d]{64}$/i.test(signature)) {
    res.status(400).json({ success: false, message: "Invalid Razorpay webhook signature." });
    return;
  }
  const expected = createHmac("sha256", secret).update(req.body).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) {
    res.status(400).json({ success: false, message: "Invalid Razorpay webhook signature." });
    return;
  }
  let event;
  try { event = JSON.parse(req.body.toString("utf8")); } catch {
    res.status(400).json({ success: false, message: "Invalid Razorpay webhook payload." });
    return;
  }
  await processRazorpayWebhook(event);
  res.status(200).json({ success: true, received: true });
});
