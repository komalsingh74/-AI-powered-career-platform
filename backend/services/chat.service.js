import ChatMessage from "../models/ChatMessage.js";
import ChatSession from "../models/ChatSession.js";
import { requestLlmCompletion } from "./llm.service.js";

export function listChatSessions(userId) {
  return ChatSession.find({ user: userId })
    .sort({ lastMessageAt: -1 })
    .select("title lastMessageAt createdAt updatedAt")
    .lean();
}

export function createChatSession(userId) {
  return ChatSession.create({ user: userId });
}

export async function getChatMessages(userId, sessionId) {
  const session = await ChatSession.findOne({ _id: sessionId, user: userId })
    .select("_id title")
    .lean();
  if (!session) return null;

  const messages = await ChatMessage.find({ session: sessionId, user: userId })
    .sort({ createdAt: 1 })
    .select("role content createdAt")
    .lean();
  return { session, messages };
}

export async function renameChatSession(userId, sessionId, title) {
  return ChatSession.findOneAndUpdate(
    { _id: sessionId, user: userId },
    { $set: { title } },
    { new: true, runValidators: true }
  )
    .select("title lastMessageAt createdAt updatedAt")
    .lean();
}

export async function deleteChatSession(userId, sessionId) {
  const session = await ChatSession.findOne({ _id: sessionId, user: userId });
  if (!session) return null;
  await ChatMessage.deleteMany({ session: sessionId, user: userId });
  await session.deleteOne();
  return session;
}

export async function sendChatMessage(userId, sessionId, content) {
  const session = await ChatSession.findOne({ _id: sessionId, user: userId });
  if (!session) return null;

  await ChatMessage.create({ session: sessionId, user: userId, role: "USER", content });
  session.lastMessageAt = new Date();
  if (session.title === "New conversation") {
    session.title = content.replace(/\s+/g, " ").slice(0, 55);
    if (content.length > 55) session.title = `${session.title.trimEnd()}…`;
  }
  await session.save();

  const history = await ChatMessage.find({ session: sessionId, user: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("role content")
    .lean();
  const response = await requestLlmCompletion({
    messages: history.reverse().map((message) => ({
      role: message.role === "USER" ? "user" : "assistant",
      content: message.content,
    })),
    systemPrompt:
      "You are a thoughtful, practical career coach. Give supportive, specific guidance about careers, interviews, job searches, and professional development. Do not invent facts about the user. Ask a concise follow-up when important context is missing.",
  });

  const assistantMessage = await ChatMessage.create({
    session: sessionId,
    user: userId,
    role: "ASSISTANT",
    content: response,
  });
  session.lastMessageAt = assistantMessage.createdAt;
  await session.save();

  return { session, message: assistantMessage };
}
