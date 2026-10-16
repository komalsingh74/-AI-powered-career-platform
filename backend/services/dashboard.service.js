import Booking from "../models/Booking.js";
import ChatSession from "../models/ChatSession.js";
import Resume from "../models/Resume.js";

export async function getDashboardSummary(userId) {
  const now = new Date();

  const [
    totalResumes,
    totalChats,
    upcomingCount,
    nextConsultation,
    completedConsultations,
  ] =
    await Promise.all([
      Resume.countDocuments({ user: userId }),
      ChatSession.countDocuments({ user: userId }),
      Booking.countDocuments({
        user: userId,
        status: { $in: ["PAID", "CONFIRMED"] },
        startAt: { $gte: now },
      }),
      Booking.findOne({
        user: userId,
        status: { $in: ["PAID", "CONFIRMED"] },
        startAt: { $gte: now },
      })
        .sort({ startAt: 1 })
        .populate("consultant", "name title")
        .lean(),
      Booking.countDocuments({ user: userId, status: "COMPLETED" }),
    ]);

  return {
    totalResumes,
    totalChats,
    upcomingConsultations: upcomingCount,
    completedConsultations,
    nextConsultation: nextConsultation || null,
  };
}
