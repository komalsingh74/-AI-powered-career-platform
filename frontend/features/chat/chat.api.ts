import { api } from "@/lib/api";

export interface ChatSession {
  _id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface ChatResponse<T> {
  success: boolean;
  data: T;
}

export async function listChatSessionsApi() {
  const { data } = await api.get<ChatResponse<{ sessions: ChatSession[] }>>(
    "/chat/sessions",
  );
  return data.data.sessions;
}

export async function createChatSessionApi() {
  const { data } = await api.post<ChatResponse<{ session: ChatSession }>>(
    "/chat/sessions",
  );
  return data.data.session;
}

export async function getChatMessagesApi(sessionId: string) {
  const { data } = await api.get<
    ChatResponse<{ session: ChatSession; messages: ChatMessage[] }>
  >(`/chat/sessions/${sessionId}/messages`);
  return data.data;
}

export async function renameChatSessionApi(sessionId: string, title: string) {
  const { data } = await api.patch<ChatResponse<{ session: ChatSession }>>(
    `/chat/sessions/${sessionId}`,
    { title },
  );
  return data.data.session;
}

export async function deleteChatSessionApi(sessionId: string) {
  await api.delete(`/chat/sessions/${sessionId}`);
}

export async function sendChatMessageApi(sessionId: string, content: string) {
  const { data } = await api.post<
    ChatResponse<{ session: ChatSession; message: ChatMessage }>
  >(`/chat/sessions/${sessionId}/messages`, { content });
  return data.data;
}
