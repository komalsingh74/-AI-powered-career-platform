import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardSummary } from "../services/dashboard.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary(req.user._id);

  res.status(200).json({
    success: true,
    data: { summary },
  });
});
