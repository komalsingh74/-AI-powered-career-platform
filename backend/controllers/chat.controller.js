import rateLimit from "express-rate-limit";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createChatSession,
  deleteChatSession,
  getChatMessages,
  listChatSessions,
  renameChatSession,
  sendChatMessage,
} from "../services/chat.service.js";

const messageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
}).strict();

const renameSchema = z.object({
  title: z.string().trim().min(1).max(100),
}).strict();

function notFoundError() {
  const error = new Error("Chat session not found");
  error.statusCode = 404;
  return error;
}

export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many chat requests. Please wait a moment and try again.",
  },
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await listChatSessions(req.user._id);
  res.status(200).json({ success: true, data: { sessions } });
});

export const postSession = asyncHandler(async (req, res) => {
  const session = await createChatSession(req.user._id);
  res.status(201).json({ success: true, data: { session } });
});

export const getSessionMessages = asyncHandler(async (req, res) => {
  const result = await getChatMessages(req.user._id, req.params.id);
  if (!result) throw notFoundError();
  res.status(200).json({ success: true, data: result });
});

export const patchSession = asyncHandler(async (req, res) => {
  const { title } = renameSchema.parse(req.body);
  const session = await renameChatSession(req.user._id, req.params.id, title);
  if (!session) throw notFoundError();
  res.status(200).json({ success: true, data: { session } });
});

export const removeSession = asyncHandler(async (req, res) => {
  const deleted = await deleteChatSession(req.user._id, req.params.id);
  if (!deleted) throw notFoundError();
  res.status(204).end();
});

export const postMessage = asyncHandler(async (req, res) => {
  const { content } = messageSchema.parse(req.body);
  const result = await sendChatMessage(req.user._id, req.params.id, content);
  if (!result) throw notFoundError();
  res.status(201).json({ success: true, data: result });
});
