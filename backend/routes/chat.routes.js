import { Router } from "express";
import {
  chatRateLimit,
  getSessionMessages,
  getSessions,
  patchSession,
  postMessage,
  postSession,
  removeSession,
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/sessions", getSessions);
router.post("/sessions", postSession);
router.get("/sessions/:id/messages", getSessionMessages);
router.patch("/sessions/:id", patchSession);
router.delete("/sessions/:id", removeSession);
router.post("/sessions/:id/messages", chatRateLimit, postMessage);

export default router;
