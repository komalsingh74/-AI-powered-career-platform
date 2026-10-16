import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, enum: ["USER", "ASSISTANT"], required: true },
    content: { type: String, required: true, trim: true, maxlength: 12000 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ session: 1, createdAt: 1 });

const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
