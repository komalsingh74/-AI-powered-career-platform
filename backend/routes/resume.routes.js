import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getResume,
  getResumes,
  generateResume,
  patchResume,
  postResume,
  removeResume,
} from "../controllers/resume.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
const resumeAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.use(requireAuth);
router.route("/").get(getResumes).post(postResume);
router.post("/:id/generate", resumeAiLimiter, generateResume);
router.route("/:id").get(getResume).patch(patchResume).delete(removeResume);

export default router;
