import Booking from "../models/Booking.js";
import Consultant from "../models/Consultant.js";
import Payment from "../models/Payment.js";
import { DateTime } from "luxon";
import {
  createRazorpayOrder,
  expireCheckoutSession,
} from "./payment.service.js";

function bookingError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseAvailabilityTime(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function listConsultants(search = "") {
  const filter = { active: true };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { title: { $regex: escaped, $options: "i" } },
      { specialties: { $regex: escaped, $options: "i" } },
    ];
  }
  return Consultant.find(filter)
    .select("name title bio specialties timeZone availability priceCents currency slotDurationMinutes")
    .sort({ name: 1 })
    .lean();
}

export async function listConsultantSlots(consultantId, date) {
  const consultant = await Consultant.findOne({ _id: consultantId, active: true })
    .select("timeZone availability slotDurationMinutes")
    .lean();
  if (!consultant) throw bookingError("This consultant is not available.", 404);

  const day = DateTime.fromISO(date, { zone: consultant.timeZone });
  if (!day.isValid || day.toFormat("yyyy-MM-dd") !== date) {
    throw bookingError("Choose a valid date.", 400);
  }

  const dayStart = day.startOf("day");
  const dayEnd = dayStart.plus({ days: 1 });
  const existingBookings = await Booking.find({
    consultant: consultant._id,
    status: { $in: ["PENDING_PAYMENT", "PAID", "CONFIRMED"] },
    startAt: { $lt: dayEnd.toUTC().toJSDate() },
    endAt: { $gt: dayStart.toUTC().toJSDate() },
  })
    .select("startAt endAt")
    .lean();

  const slots = new Map();
  const duration = consultant.slotDurationMinutes || 60;
  const now = DateTime.now();
  for (const window of (consultant.availability || []).filter(
    (item) => item.dayOfWeek === day.weekday % 7,
  )) {
    const start = parseAvailabilityTime(window.startTime);
    const end = parseAvailabilityTime(window.endTime);
    if (start === null || end === null) continue;

    for (let minute = start; minute + duration <= end; minute += duration) {
      const localStart = dayStart.set({
        hour: Math.floor(minute / 60),
        minute: minute % 60,
        second: 0,
        millisecond: 0,
      });
      if (!localStart.isValid || localStart <= now) continue;
      const localEnd = localStart.plus({ minutes: duration });
      const startAt = localStart.toUTC().toJSDate();
      const endAt = localEnd.toUTC().toJSDate();
      const available = !existingBookings.some(
        (booking) => booking.startAt < endAt && booking.endAt > startAt,
      );
      const slot = {
        startAt: startAt.toISOString(),
        time: localStart.toFormat("HH:mm"),
        available,
      };
      slots.set(slot.startAt, slot);
    }
  }

  return {
    consultantId: consultant._id,
    date,
    timeZone: consultant.timeZone,
    slotDurationMinutes: duration,
    slots: [...slots.values()].sort((a, b) => a.startAt.localeCompare(b.startAt)),
  };
}

export async function createConsultationBooking(userId, input) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw bookingError("Payments are not configured. Please try again later.", 503);
  }

  const consultant = await Consultant.findOne({
    _id: input.consultantId,
    active: true,
  }).lean();
  if (!consultant) throw bookingError("This consultant is not available.", 404);

  const requestedStart = DateTime.fromISO(input.startAt, { setZone: true });
  if (!requestedStart.isValid) {
    throw bookingError("Choose a valid consultation time.", 400);
  }
  const localStart = requestedStart.setZone(consultant.timeZone);
  if (!localStart.isValid) {
    throw bookingError("The consultant has an invalid time zone configured.", 500);
  }
  const startAt = localStart.toUTC().toJSDate();
  const duration = consultant.slotDurationMinutes || 60;
  const endAt = localStart.plus({ minutes: duration }).toUTC().toJSDate();
  if (startAt <= new Date()) {
    throw bookingError("Choose a consultation time in the future.", 400);
  }

  const localMinutes = localStart.hour * 60 + localStart.minute;
  if (localStart.second !== 0 || localStart.millisecond !== 0) {
    throw bookingError("Choose a valid consultation time.", 400);
  }
  const available = (consultant.availability || []).some((window) => {
    const from = parseAvailabilityTime(window.startTime);
    const until = parseAvailabilityTime(window.endTime);
    return (
      window.dayOfWeek === localStart.weekday % 7 &&
      from !== null &&
      until !== null &&
      localMinutes >= from &&
      localMinutes + duration <= until &&
      (localMinutes - from) % duration === 0
    );
  });
  if (!available) {
    throw bookingError("That time is outside the consultant’s available hours.", 409);
  }

  const collision = await Booking.exists({
    consultant: consultant._id,
    status: { $in: ["PENDING_PAYMENT", "PAID", "CONFIRMED"] },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });
  if (collision) {
    throw bookingError("That consultation time has just been booked. Choose another slot.", 409);
  }

  let booking;
  try {
    booking = await Booking.create({
      user: userId,
      consultant: consultant._id,
      startAt,
      endAt,
      name: input.name,
      email: input.email,
      phone: input.phone || "",
      agenda: input.agenda || "",
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
    });
  } catch (error) {
    if (error.code === 11000) {
      throw bookingError("That consultation time has just been booked. Choose another slot.", 409);
    }
    throw error;
  }

  try {
    const checkout = await createRazorpayOrder(booking, userId);
    return { booking, checkout };
  } catch (error) {
    await Booking.updateOne(
      { _id: booking._id, status: "PENDING_PAYMENT" },
      { $set: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" } }
    );
    throw error;
  }
}

export async function listUserBookings(userId, { page, limit, status, search, sort }) {
  const filter = { user: userId };
  if (status) filter.status = status;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("consultant", "name title")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);
  return {
    bookings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export function findUserBooking(userId, bookingId) {
  return Booking.findOne({ _id: bookingId, user: userId })
    .populate("consultant", "name title")
    .lean();
}

export async function cancelPendingCheckout(userId, bookingId) {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) throw bookingError("Booking not found", 404);
  if (booking.status !== "PENDING_PAYMENT" || !booking.checkoutSessionId) {
    return booking;
  }

  const stripeSession = await expireCheckoutSession(booking.checkoutSessionId);
  if (stripeSession.status === "expired") {
    const update = await Booking.updateOne(
      { _id: booking._id, status: "PENDING_PAYMENT" },
      { $set: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" } }
    );
    if (update.modifiedCount > 0) {
      await Payment.updateOne(
        { stripeSessionId: booking.checkoutSessionId },
        { $set: { status: "FAILED" } }
      );
    }
  }
  return findUserBooking(userId, bookingId);
}
