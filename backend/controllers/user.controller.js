import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  toPublicUser,
} from "../services/auth.service.js";
import {
  updateUserProfile,
} from "../services/user.service.js";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  profile: z.object({
    headline: z.string().max(160).optional(),
    location: z.string().max(120).optional(),
    skills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
    experienceYears: z.number().min(0).max(60).optional(),
  }).optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: toPublicUser(req.user) },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const input = profileSchema.parse(req.body);

  const user = await updateUserProfile(req.user._id, input);

  if (!user) {
    const error = new Error("User account not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user: toPublicUser(user) },
  });
});