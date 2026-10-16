import { api } from "@/lib/api";

export interface DashboardSummary {
  totalResumes: number;
  totalChats: number;
  upcomingConsultations: number;
  completedConsultations: number;
  nextConsultation: {
    startAt: string;
    endAt: string;
    consultant: { name: string; title: string } | null;
  } | null;
}

interface DashboardResponse {
  success: boolean;
  data: { summary: DashboardSummary };
}

export async function getDashboardSummaryApi() {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data.data.summary;
}
