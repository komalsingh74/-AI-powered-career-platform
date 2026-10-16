import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New conversation",
      trim: true,
      maxlength: 100,
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ChatSession =
  mongoose.models.ChatSession ||
  mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;