import { Router } from "express";
import {
  getBooking,
  getBookings,
  getConsultants,
  getConsultantSlots,
  postCancelCheckout,
  postBooking,
} from "../controllers/booking.controller.js";
import { verifyRazorpayBookingPayment } from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/consultants", getConsultants);
router.get("/consultants/:id/slots", getConsultantSlots);
router.route("/bookings").get(getBookings).post(postBooking);
router.get("/bookings/:id", getBooking);
router.post("/bookings/:id/verify-payment", verifyRazorpayBookingPayment);
router.post("/bookings/:id/cancel-checkout", postCancelCheckout);

export default router;
