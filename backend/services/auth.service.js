import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailPattern.test(normalizedEmail)) {
    const error = new Error("Enter a valid email address");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    return await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "USER",
    });
  } catch (error) {
    // Handles simultaneous registration attempts for the same email.
    if (error.code === 11000) {
      const conflict = new Error("Email is already registered");
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  const passwordMatches =
    user && (await bcrypt.compare(password, user.password));

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    secret,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    }
  );

  return { user, token };
}

export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}