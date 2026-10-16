import { api } from "@/lib/api";

export interface ConsultantAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Consultant {
  _id: string;
  name: string;
  title: string;
  bio: string;
  specialties: string[];
  timeZone: string;
  availability: ConsultantAvailability[];
  priceCents: number;
  currency: string;
  slotDurationMinutes: number;
}

export interface ConsultantSlot {
  startAt: string;
  time: string;
  available: boolean;
}

export interface ConsultationBooking {
  _id: string;
  startAt: string;
  endAt: string;
  status:
    | "PENDING_PAYMENT"
    | "PAYMENT_FAILED"
    | "PAID"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  meetingUrl: string;
  calendarStatus: string;
  notificationStatus: string;
  consultant: { name: string; title: string } | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function listConsultantsApi(search = "") {
  const { data } = await api.get<ApiResponse<{ consultants: Consultant[] }>>(
    "/consultations/consultants",
    { params: { search: search || undefined } },
  );
  return data.data.consultants;
}

export async function listConsultantSlotsApi(consultantId: string, date: string) {
  const { data } = await api.get<
    ApiResponse<{ slots: ConsultantSlot[]; timeZone: string }>
  >(`/consultations/consultants/${consultantId}/slots`, { params: { date } });
  return data.data;
}

export async function listBookingsApi() {
  const { data } = await api.get<
    ApiResponse<{
      bookings: ConsultationBooking[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>
  >("/consultations/bookings", {
    params: { page: 1, limit: 50, sort: "-startAt" },
  });
  return data.data;
}

export async function getBookingApi(id: string) {
  const { data } = await api.get<ApiResponse<{ booking: ConsultationBooking }>>(
    `/consultations/bookings/${id}`,
  );
  return data.data.booking;
}

export async function cancelCheckoutApi(id: string) {
  const { data } = await api.post<
    ApiResponse<{ booking: ConsultationBooking }>
  >(`/consultations/bookings/${id}/cancel-checkout`);
  return data.data.booking;
}

export async function createBookingApi(input: {
  consultantId: string;
  startAt: string;
  name: string;
  email: string;
  phone: string;
  agenda: string;
}) {
  const { data } = await api.post<
    ApiResponse<{
      booking: ConsultationBooking;
      checkout: { orderId: string; amount: number; currency: string; keyId: string; name: string; email: string; phone: string };
    }>
  >("/consultations/bookings", input);
  return data.data;
}

export async function verifyBookingPaymentApi(id: string, input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { data } = await api.post<ApiResponse<{ booking: ConsultationBooking }>>(
    `/consultations/bookings/${id}/verify-payment`, input,
  );
  return data.data.booking;
}
