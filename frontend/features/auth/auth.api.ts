import { api } from "@/lib/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN" | "CONSULTANT";
  profile?: {
    headline: string;
    location: string;
    skills: string[];
    experienceYears: number;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

export async function registerApi(input: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<AuthResponse>(
    "/auth/register",
    input
  );

  return data;
}

export async function loginApi(input: {
  email: string;
  password: string;
}) {
  const { data } = await api.post<AuthResponse>(
    "/auth/login",
    input
  );

  return data;
}

export async function logoutApi() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function getMeApi() {
  const { data } = await api.get<AuthResponse>("/users/me");
  return data;
}

export async function updateMeApi(input: {
  name?: string;
  phone?: string;
  profile?: Partial<NonNullable<AuthUser["profile"]>>;
}) {
  const { data } = await api.patch<AuthResponse>("/users/me", input);
  return data;
}