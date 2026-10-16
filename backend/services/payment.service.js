import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import Booking from "../models/Booking.js";
import Consultant from "../models/Consultant.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import StripeEvent from "../models/StripeEvent.js";
import RazorpayPayment from "../models/RazorpayPayment.js";

function serviceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function razorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw serviceError("Razorpay is not configured on this server.", 503);
  return { keyId, keySecret };
}

async function razorpayRequest(path, { method = "GET", body } = {}) {
  const { keyId, keySecret } = razorpayCredentials();
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  let result;
  try { result = await response.json(); } catch {
    throw serviceError("Razorpay returned an invalid response.", 502);
  }
  if (!response.ok) {
    const message = response.status === 401
      ? "Razorpay rejected the configured test keys. Check the key ID and secret in backend/.env."
      : "Razorpay could not process this payment request.";
    throw serviceError(message, response.status === 401 ? 503 : 502);
  }
  return result;
}

export async function createRazorpayOrder(booking, userId) {
  const [consultant, user] = await Promise.all([
    Consultant.findById(booking.consultant).select("name priceCents currency").lean(),
    User.findById(userId).select("name email phone").lean(),
  ]);
  if (!consultant || !user) throw serviceError("Unable to prepare checkout for this booking.", 500);
  if (!Number.isSafeInteger(consultant.priceCents) || consultant.priceCents < 1) {
    throw serviceError("This consultant does not have a valid consultation price.", 400);
  }
  const currency = String(consultant.currency || "inr").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw serviceError("This consultant has an invalid currency.", 400);

  const order = await razorpayRequest("orders", {
    method: "POST",
    body: {
      amount: consultant.priceCents,
      currency,
      receipt: `booking_${booking._id}`,
      notes: { bookingId: booking._id.toString(), userId: userId.toString() },
    },
  });
  if (typeof order.id !== "string" || order.amount !== consultant.priceCents || order.currency !== currency) {
    throw serviceError("Razorpay returned an invalid order.", 502);
  }
  await RazorpayPayment.create({
    booking: booking._id,
    user: userId,
    orderId: order.id,
    amount: order.amount,
    currency: currency.toLowerCase(),
  });
  await Booking.updateOne(
    { _id: booking._id, status: "PENDING_PAYMENT" },
    { $set: { razorpayOrderId: order.id } },
  );
  const { keyId } = razorpayCredentials();
  return { orderId: order.id, amount: order.amount, currency, keyId, name: consultant.name, email: user.email, phone: user.phone || "" };
}

async function stripeRequest(path, body, idempotencyKey) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw serviceError("Payments are not configured on this server.", 503);
  }

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  let result;
  try {
    result = await response.json();
  } catch {
    throw serviceError("The payment provider returned an invalid response.", 502);
  }
  if (!response.ok) {
    throw serviceError("The payment provider could not start checkout.", 502);
  }
  return result;
}

export async function createCheckoutSession(booking, userId) {
  const [consultant, user] = await Promise.all([
    Consultant.findById(booking.consultant).select("name priceCents currency").lean(),
    User.findById(userId).select("name email").lean(),
  ]);
  if (!consultant || !user) {
    throw serviceError("Unable to prepare checkout for this booking.", 500);
  }
  if (!Number.isInteger(consultant.priceCents) || consultant.priceCents <= 0) {
    throw serviceError("This consultant does not have a valid consultation price.", 400);
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_email", user.email);
  form.set("client_reference_id", booking._id.toString());
  form.set("success_url", `${clientUrl}/consultations?booking=${booking._id}&payment=processing`);
  form.set("cancel_url", `${clientUrl}/consultations?booking=${booking._id}&payment=cancelled`);
  form.set("expires_at", String(Math.floor(Date.now() / 1000) + 31 * 60));
  form.set("metadata[bookingId]", booking._id.toString());
  form.set("metadata[userId]", userId.toString());
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", consultant.currency);
  form.set("line_items[0][price_data][unit_amount]", String(consultant.priceCents));
  form.set("line_items[0][price_data][product_data][name]", `Career consultation with ${consultant.name}`);
  const durationMinutes = Math.round((booking.endAt - booking.startAt) / 60000);
  form.set(
    "line_items[0][price_data][product_data][description]",
    `${durationMinutes}-minute career consultation`,
  );

  const session = await stripeRequest(
    "checkout/sessions",
    form,
    `booking-checkout-${booking._id}`
  );
  if (typeof session.id !== "string" || typeof session.url !== "string") {
    throw serviceError("The payment provider returned an invalid checkout session.", 502);
  }

  await Payment.create({
    booking: booking._id,
    user: userId,
    stripeSessionId: session.id,
    amountCents: consultant.priceCents,
    currency: consultant.currency,
  });
  await Booking.updateOne(
    { _id: booking._id, status: "PENDING_PAYMENT" },
    { $set: { checkoutSessionId: session.id } }
  );

  return { sessionId: session.id, checkoutUrl: session.url };
}

async function getStripeCheckoutSession(sessionId) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw serviceError("Payments are not configured on this server.", 503);
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!response.ok) throw serviceError("Unable to verify the payment session.", 502);
  return response.json();
}

export async function expireCheckoutSession(sessionId) {
  const form = new URLSearchParams();
  try {
    return await stripeRequest(
      `checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
      form,
      `expire-checkout-${sessionId}`
    );
  } catch {
    return getStripeCheckoutSession(sessionId);
  }
}

async function refreshGoogleAccessToken() {
  const {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
    GOOGLE_REFRESH_TOKEN: refreshToken,
  } = process.env;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw serviceError("Google Calendar authentication failed.", 502);
  const token = await response.json();
  if (typeof token.access_token !== "string") {
    throw serviceError("Google Calendar returned an invalid access token.", 502);
  }
  return token.access_token;
}

async function createCalendarEvent(booking, consultant, user) {
  const accessToken = await refreshGoogleAccessToken();
  if (!accessToken) return { status: "UNCONFIGURED" };

  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");
  const eventId = `t${createHash("sha256").update(booking._id.toString()).digest("hex")}`;
  const event = {
    id: eventId,
    summary: `Career consultation with ${consultant.name}`,
    description: booking.agenda || "Career consultation",
    start: { dateTime: booking.startAt.toISOString(), timeZone: consultant.timeZone },
    end: { dateTime: booking.endAt.toISOString(), timeZone: consultant.timeZone },
    attendees: [
      { email: user.email, displayName: user.name },
      { email: consultant.email, displayName: consultant.name },
    ],
    conferenceData: {
      createRequest: {
        requestId: eventId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(15000),
    }
  );
  if (response.status === 409) {
    const existingResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) }
    );
    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      return {
        status: "CREATED",
        eventId: existing.id,
        meetingUrl: existing.hangoutLink || existing.htmlLink || "",
      };
    }
  }
  if (!response.ok) throw serviceError("Google Calendar could not create the meeting.", 502);
  const result = await response.json();
  return {
    status: "CREATED",
    eventId: result.id,
    meetingUrl: result.hangoutLink || result.htmlLink || "",
  };
}

async function sendConfirmationEmail(booking, consultant, user) {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { status: "UNCONFIGURED" };

  const dateFormat = new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: consultant.timeZone,
  });
  const meetingLink = booking.meetingUrl || "Meeting details will be shared before your consultation.";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `booking-confirmation-${booking._id}`,
    },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: "Your career consultation is confirmed",
      text: [
        `Hi ${user.name},`,
        "",
        `Your consultation with ${consultant.name} is confirmed.`,
        `Date and time: ${dateFormat.format(booking.startAt)}`,
        `Meeting: ${meetingLink}`,
        `Booking ID: ${booking._id}`,
        "",
        "We look forward to helping with your next career step.",
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw serviceError("The confirmation email could not be sent.", 502);
  return { status: "SENT" };
}

async function completeStripePaidBooking(stripeSession) {
  const bookingId = stripeSession.metadata?.bookingId;
  const userId = stripeSession.metadata?.userId;
  if (!bookingId || !userId || stripeSession.payment_status !== "paid") {
    throw serviceError("The completed payment does not match a booking.", 400);
  }

  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking || booking.checkoutSessionId !== stripeSession.id) {
    throw serviceError("The paid booking could not be found.", 404);
  }

  if (booking.status === "PENDING_PAYMENT") {
    booking.status = "PAID";
    booking.paymentStatus = "PAID";
    booking.paymentIntentId =
      typeof stripeSession.payment_intent === "string"
        ? stripeSession.payment_intent
        : "";
    await booking.save();
  }
  if (booking.status === "PAID") {
    booking.status = "CONFIRMED";
    await booking.save();
  }
  if (booking.status !== "CONFIRMED") return;

  await Payment.updateOne(
    { stripeSessionId: stripeSession.id },
    {
      $set: {
        status: "PAID",
        stripePaymentIntentId:
          typeof stripeSession.payment_intent === "string"
            ? stripeSession.payment_intent
            : "",
      },
    }
  );

  await fulfillConfirmedBooking(booking);
}

async function fulfillConfirmedBooking(booking) {
  if (booking.status !== "CONFIRMED") return;

  const fullBooking = await Booking.findById(booking._id)
    .populate("consultant")
    .lean();
  const [consultant, user] = await Promise.all([
    Consultant.findById(fullBooking.consultant._id).lean(),
    User.findById(fullBooking.user).select("name email").lean(),
  ]);
  if (!consultant || !user) {
    throw serviceError("Unable to prepare the confirmed consultation.", 500);
  }

  if (fullBooking.calendarStatus === "PENDING" || fullBooking.calendarStatus === "FAILED") {
    try {
      const calendar = await createCalendarEvent(fullBooking, consultant, user);
      await Booking.updateOne(
        { _id: booking._id },
        {
          $set: {
            calendarStatus: calendar.status,
            ...(calendar.eventId ? { calendarEventId: calendar.eventId } : {}),
            ...(calendar.meetingUrl ? { meetingUrl: calendar.meetingUrl } : {}),
          },
        }
      );
    } catch (error) {
      await Booking.updateOne({ _id: booking._id }, { $set: { calendarStatus: "FAILED" } });
      throw error;
    }
  }

  const refreshedBooking = await Booking.findById(booking._id).lean();
  if (
    refreshedBooking.notificationStatus === "PENDING" ||
    refreshedBooking.notificationStatus === "FAILED"
  ) {
    try {
      const email = await sendConfirmationEmail(refreshedBooking, consultant, user);
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { notificationStatus: email.status } }
      );
    } catch (error) {
      await Booking.updateOne({ _id: booking._id }, { $set: { notificationStatus: "FAILED" } });
      throw error;
    }
  }
}

async function completeRazorpayPaidBooking(orderId, paymentId) {
  const payment = await RazorpayPayment.findOne({ orderId });
  if (!payment) throw serviceError("The paid consultation could not be found.", 404);
  const booking = await Booking.findOne({ _id: payment.booking, user: payment.user });
  if (!booking || booking.razorpayOrderId !== orderId) {
    throw serviceError("The paid consultation could not be found.", 404);
  }
  if (payment.status === "PAID" && booking.status === "CONFIRMED") return;
  if (booking.status !== "PENDING_PAYMENT" && booking.status !== "PAID" && booking.status !== "CONFIRMED") {
    throw serviceError("This booking is no longer awaiting payment.", 409);
  }
  if (booking.status === "PENDING_PAYMENT") {
    booking.status = "PAID";
    booking.paymentStatus = "PAID";
    booking.paymentIntentId = paymentId;
    await booking.save();
  }
  if (booking.status === "PAID") {
    booking.status = "CONFIRMED";
    await booking.save();
  }
  await RazorpayPayment.updateOne({ _id: payment._id }, { $set: { status: "PAID", paymentId } });
  await fulfillConfirmedBooking(booking);
}

export async function verifyRazorpayPayment(userId, { bookingId, orderId, paymentId, signature }) {
  const { keySecret } = razorpayCredentials();
  const payment = await RazorpayPayment.findOne({ booking: bookingId, user: userId, orderId });
  if (!payment) throw serviceError("Payment order does not match this booking.", 400);
  // Razorpay Checkout signatures are HMAC-SHA256 over the server stored order ID and payment ID.
  const digest = createHmac("sha256", keySecret)
    .update(`${payment.orderId}|${paymentId}`)
    .digest();
  if (!/^[a-f\d]{64}$/i.test(signature) || !timingSafeEqual(digest, Buffer.from(signature, "hex"))) {
    throw serviceError("Razorpay payment signature could not be verified.", 400);
  }
  const remotePayment = await razorpayRequest(`payments/${encodeURIComponent(paymentId)}`);
  if (
    remotePayment.order_id !== payment.orderId ||
    remotePayment.amount !== payment.amount ||
    String(remotePayment.currency).toLowerCase() !== payment.currency
  ) throw serviceError("Payment details do not match this consultation.", 400);

  let confirmedPayment = remotePayment;
  if (remotePayment.status === "authorized") {
    confirmedPayment = await razorpayRequest(`payments/${encodeURIComponent(paymentId)}/capture`, {
      method: "POST",
      body: { amount: payment.amount, currency: payment.currency.toUpperCase() },
    });
  }
  if (confirmedPayment.status !== "captured") {
    throw serviceError("Razorpay has not captured this payment yet.", 409);
  }
  await completeRazorpayPaidBooking(payment.orderId, paymentId);
  return Booking.findOne({ _id: bookingId, user: userId }).populate("consultant", "name title").lean();
}

export async function processRazorpayWebhook(event) {
  if (event.event !== "payment.captured") return;
  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id || !entity?.id) return;
  const payment = await RazorpayPayment.findOne({ orderId: entity.order_id });
  if (!payment || entity.amount !== payment.amount || String(entity.currency).toLowerCase() !== payment.currency) {
    throw serviceError("Webhook payment did not match a consultation order.", 400);
  }
  await completeRazorpayPaidBooking(payment.orderId, entity.id);
}

export async function processStripeEvent(event) {
  let record;
  try {
    record = await StripeEvent.findOneAndUpdate(
      { eventId: event.id },
      { $setOnInsert: { eventId: event.id, type: event.type, status: "RECEIVED" } },
      { upsert: true, new: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    record = await StripeEvent.findOne({ eventId: event.id });
  }

  if (!record) throw serviceError("Unable to record the payment event.", 500);
  if (record.status === "PROCESSED") return;

  const claimed = await StripeEvent.findOneAndUpdate(
    { _id: record._id, status: { $in: ["RECEIVED", "FAILED"] } },
    { $set: { status: "PROCESSING", lastError: "" } },
    { new: true }
  );
  if (!claimed) {
    const current = await StripeEvent.findById(record._id).select("status").lean();
    if (current?.status === "PROCESSED") return;
    throw serviceError("This payment event is already being processed.", 503);
  }

  try {
    const session = event.data?.object;
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      if (session.payment_status === "paid") await completeStripePaidBooking(session);
    } else if (
      event.type === "checkout.session.async_payment_failed" ||
      event.type === "checkout.session.expired"
    ) {
      const bookingId = session.metadata?.bookingId;
      const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, checkoutSessionId: session.id, status: "PENDING_PAYMENT" },
        { $set: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" } },
        { new: true }
      );
      if (booking) {
        await Payment.updateOne(
          { stripeSessionId: session.id },
          { $set: { status: "FAILED" } }
        );
      }
    }

    await StripeEvent.updateOne(
      { _id: record._id },
      { $set: { status: "PROCESSED", processedAt: new Date(), lastError: "" } }
    );
  } catch (error) {
    await StripeEvent.updateOne(
      { _id: record._id },
      { $set: { status: "FAILED", lastError: error.message.slice(0, 500) } }
    );
    throw error;
  }
}
