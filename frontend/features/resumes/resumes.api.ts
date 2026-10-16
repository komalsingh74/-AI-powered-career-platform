import { api } from "@/lib/api";

export type ResumeTemplate = "MODERN" | "ATS_CLASSIC";

export interface ResumeContent {
  personalInformation: {
    name: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
    links: string[];
  };
  summary: string;
  education: ResumeEntry[];
  experience: ResumeEntry[];
  skills: string[];
  projects: ResumeEntry[];
  certifications: ResumeEntry[];
  achievements: string[];
}

export type ResumeDraftContent = Partial<
  Omit<ResumeContent, "personalInformation">
> & {
  personalInformation?: Partial<ResumeContent["personalInformation"]>;
};

export interface ResumeEntry {
  name?: string;
  title?: string;
  company?: string;
  school?: string;
  degree?: string;
  field?: string;
  issuer?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  description?: string;
  url?: string;
  technologies?: string[];
}

export interface Resume {
  _id: string;
  title: string;
  template: ResumeTemplate;
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
}

interface ResumeResponse {
  success: boolean;
  data: { resume: Resume };
}

interface ResumeListResponse {
  success: boolean;
  data: {
    resumes: Resume[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

export async function listResumesApi(search = "") {
  const { data } = await api.get<ResumeListResponse>("/resumes", {
    params: { page: 1, limit: 50, sort: "-updatedAt", search: search || undefined },
  });
  return data.data;
}

export async function getResumeApi(id: string) {
  const { data } = await api.get<ResumeResponse>(`/resumes/${id}`);
  return data.data.resume;
}

export async function createResumeApi(input: {
  title: string;
  template?: ResumeTemplate;
  content?: ResumeDraftContent;
}) {
  const { data } = await api.post<ResumeResponse>("/resumes", input);
  return data.data.resume;
}

export async function updateResumeApi(
  id: string,
  input: {
    title?: string;
    template?: ResumeTemplate;
    content?: ResumeDraftContent;
  },
) {
  const { data } = await api.patch<ResumeResponse>(`/resumes/${id}`, input);
  return data.data.resume;
}

export async function generateResumeApi(id: string, targetRole: string) {
  const { data } = await api.post<ResumeResponse>(`/resumes/${id}/generate`, {
    targetRole: targetRole.trim() || undefined,
  });
  return data.data.resume;
}

export async function deleteResumeApi(id: string) {
  await api.delete(`/resumes/${id}`);
}
