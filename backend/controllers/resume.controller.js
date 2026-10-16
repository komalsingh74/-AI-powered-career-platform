import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createResume,
  deleteResume,
  findResume,
  generateResumeContent,
  listResumes,
  updateResume,
} from "../services/resume.service.js";

const entrySchema = z.object({
  name: z.string().trim().max(120).optional(),
  title: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  school: z.string().trim().max(120).optional(),
  degree: z.string().trim().max(120).optional(),
  field: z.string().trim().max(120).optional(),
  issuer: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  startDate: z.string().trim().max(40).optional(),
  endDate: z.string().trim().max(40).optional(),
  date: z.string().trim().max(40).optional(),
  description: z.string().trim().max(3000).optional(),
  url: z.string().trim().max(300).optional(),
  technologies: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
}).strict();

const contentSchema = z.object({
  personalInformation: z.object({
    name: z.string().trim().max(80).optional(),
    email: z.string().trim().email().max(254).or(z.literal("")).optional(),
    phone: z.string().trim().max(20).optional(),
    location: z.string().trim().max(120).optional(),
    headline: z.string().trim().max(160).optional(),
    links: z.array(z.string().trim().max(300)).max(10).optional(),
  }).strict().optional(),
  summary: z.string().trim().max(5000).optional(),
  education: z.array(entrySchema).max(30).optional(),
  experience: z.array(entrySchema).max(50).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(100).optional(),
  projects: z.array(entrySchema).max(50).optional(),
  certifications: z.array(entrySchema).max(50).optional(),
  achievements: z.array(z.string().trim().min(1).max(300)).max(50).optional(),
}).strict();

const createSchema = z.object({
  title: z.string().trim().min(1).max(100),
  template: z.enum(["MODERN", "ATS_CLASSIC"]).optional(),
  content: contentSchema.optional(),
}).strict();

const updateSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  template: z.enum(["MODERN", "ATS_CLASSIC"]).optional(),
  content: contentSchema.optional(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: "Provide at least one field to update",
});

const generateSchema = z.object({
  targetRole: z.string().trim().max(120).optional(),
}).strict();

const notFoundError = () => {
  const error = new Error("Resume not found");
  error.statusCode = 404;
  return error;
};

export const getResumes = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const search =
    typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const sortValue = typeof req.query.sort === "string" ? req.query.sort : "-updatedAt";
  const sortField = sortValue.replace(/^-/, "");
  const sort = ["title", "createdAt", "updatedAt"].includes(sortField)
    ? { [sortField]: sortValue.startsWith("-") ? -1 : 1 }
    : { updatedAt: -1 };

  const result = await listResumes(req.user._id, { page, limit, search, sort });
  res.status(200).json({ success: true, data: result });
});

export const postResume = asyncHandler(async (req, res) => {
  const input = createSchema.parse(req.body);
  const resume = await createResume(req.user._id, input);
  res.status(201).json({ success: true, data: { resume } });
});

export const getResume = asyncHandler(async (req, res) => {
  const resume = await findResume(req.user._id, req.params.id);
  if (!resume) throw notFoundError();
  res.status(200).json({ success: true, data: { resume } });
});

export const patchResume = asyncHandler(async (req, res) => {
  const input = updateSchema.parse(req.body);
  const resume = await updateResume(req.user._id, req.params.id, input);
  if (!resume) throw notFoundError();
  res.status(200).json({ success: true, data: { resume } });
});

export const removeResume = asyncHandler(async (req, res) => {
  const deleted = await deleteResume(req.user._id, req.params.id);
  if (!deleted) throw notFoundError();
  res.status(204).end();
});

export const generateResume = asyncHandler(async (req, res) => {
  const input = generateSchema.parse(req.body);
  const resume = await generateResumeContent(
    req.user._id,
    req.params.id,
    input
  );
  if (!resume) throw notFoundError();
  res.status(200).json({
    success: true,
    message: "Resume content generated",
    data: { resume },
  });
});
