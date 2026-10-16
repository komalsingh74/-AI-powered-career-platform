import { z } from "zod";
import {
  registerUser,
  loginUser,
  toPublicUser,
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const register = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: { user: toPublicUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const { user, token } = await loginUser(input);

  res.cookie("accessToken", token, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user: toPublicUser(user) },
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", cookieOptions);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});