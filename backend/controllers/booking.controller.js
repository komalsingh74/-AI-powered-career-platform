import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createConsultationBooking,
  cancelPendingCheckout,
  findUserBooking,
  listConsultants,
  listConsultantSlots,
  listUserBookings,
} from "../services/booking.service.js";

const bookingSchema = z.object({
  consultantId: z.string().regex(/^[a-f\d]{24}$/i),
  startAt: z.string().datetime(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(20).optional(),
  agenda: z.string().trim().max(1000).optional(),
}).strict();

const bookingStatuses = [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "PAID",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

export const getConsultants = asyncHandler(async (req, res) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const consultants = await listConsultants(search);
  res.status(200).json({ success: true, data: { consultants } });
});

export const getConsultantSlots = asyncHandler(async (req, res) => {
  const id = z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);
  const result = await listConsultantSlots(id, date);
  res.status(200).json({ success: true, data: result });
});

export const getBookings = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const search =
    typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  if (status && !bookingStatuses.includes(status)) {
    const error = new Error("Invalid booking status filter");
    error.statusCode = 400;
    throw error;
  }
  const sortValue = typeof req.query.sort === "string" ? req.query.sort : "-startAt";
  const sortField = sortValue.replace(/^-/, "");
  const sort = ["startAt", "createdAt"].includes(sortField)
    ? { [sortField]: sortValue.startsWith("-") ? -1 : 1 }
    : { startAt: -1 };

  const result = await listUserBookings(req.user._id, {
    page,
    limit,
    search,
    status,
    sort,
  });
  res.status(200).json({ success: true, data: result });
});

export const postBooking = asyncHandler(async (req, res) => {
  const input = bookingSchema.parse(req.body);
  const result = await createConsultationBooking(req.user._id, {
    ...input,
    email: input.email.toLowerCase(),
  });
  res.status(201).json({
    success: true,
    data: {
      booking: result.booking,
      checkout: result.checkout,
    },
  });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await findUserBooking(req.user._id, req.params.id);
  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }
  res.status(200).json({ success: true, data: { booking } });
});

export const postCancelCheckout = asyncHandler(async (req, res) => {
  const booking = await cancelPendingCheckout(req.user._id, req.params.id);
  res.status(200).json({ success: true, data: { booking } });
});
