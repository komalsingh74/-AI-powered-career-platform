"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { getMeApi, type AuthUser } from "@/features/auth/auth.api";
import {
  createBookingApi,
  cancelCheckoutApi,
  getBookingApi,
  listBookingsApi,
  listConsultantsApi,
  listConsultantSlotsApi,
  verifyBookingPaymentApi,
  type ConsultationBooking,
  type Consultant,
  type ConsultantSlot,
} from "@/features/consultations/consultations.api";

function dayString(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatSlot(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function statusLabel(status: ConsultationBooking["status"]) {
  return status.replaceAll("_", " ").toLowerCase();
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
};

type RazorpayCheckoutData = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  email: string;
  phone: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void; on: (event: string, callback: (error: { description?: string }) => void) => void };
  }
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ConsultationsPage() {
  const router = useRouter();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [today, setToday] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotResult, setSlotResult] = useState<{
    key: string;
    slots: ConsultantSlot[];
    error: string;
  } | null>(null);
  const [agenda, setAgenda] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{ bookingId: string; checkout: RazorpayCheckoutData } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentNotice, setPaymentNotice] = useState("");
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const timeZone = selectedConsultant?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      setToday(dayString(new Date(), timeZone));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [selectedConsultant?.timeZone]);

  const slotRequestKey = selectedConsultant && selectedDate
    ? `${selectedConsultant._id}:${selectedDate}`
    : "";
  const currentSlotResult = slotResult?.key === slotRequestKey ? slotResult : null;
  const slots = currentSlotResult?.slots ?? [];
  const slotsError = currentSlotResult?.error ?? "";
  const slotsLoading = Boolean(slotRequestKey && !currentSlotResult);

  const loadData = useCallback(async () => {
    try {
      const [experts, bookingResult, userResult] = await Promise.all([
        listConsultantsApi(),
        listBookingsApi(),
        getMeApi(),
      ]);
      setConsultants(experts);
      setBookings(bookingResult.bookings);
      setUser(userResult.data.user);
      setPhone(userResult.data.user.phone || "");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        router.replace("/login");
        return;
      }
      toast.error("Unable to load consultation details.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  useEffect(() => {
    if (!selectedConsultant || !selectedDate) return;

    let active = true;
    const key = `${selectedConsultant._id}:${selectedDate}`;
    void listConsultantSlotsApi(selectedConsultant._id, selectedDate)
      .then((result) => {
        if (active) {
          setSlotResult({
            key,
            slots: result.slots.filter((slot) => slot.available),
            error: "",
          });
        }
      })
      .catch(() => {
        if (active) {
          setSlotResult({
            key,
            slots: [],
            error: "Unable to load times. Please choose the date again.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedConsultant, selectedDate]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking");
    const wasCancelled = params.get("payment") === "cancelled";
    if (!bookingId) return;

    let attempts = 0;
    const checkStatus = async () => {
      try {
        if (wasCancelled && attempts === 0) {
          try {
            await cancelCheckoutApi(bookingId);
          } catch {
            if (active) {
              setPaymentNotice("Checking the latest payment status with the server…");
            }
          }
        }
        const currentBooking = await getBookingApi(bookingId);
        if (!active) return;
        if (currentBooking.status === "CONFIRMED") {
          setPaymentNotice("Your payment is confirmed and your consultation is booked.");
          setBookings((current) => [
            currentBooking,
            ...current.filter((item) => item._id !== currentBooking._id),
          ]);
          return true;
        }
        if (currentBooking.status === "PAYMENT_FAILED") {
          setPaymentNotice("Payment wasn’t completed. You can choose a new session time.");
          return true;
        }
      } catch {
        if (active) setPaymentNotice("We couldn’t check your booking status. Refresh to try again.");
        return true;
      }
      attempts += 1;
      if (attempts >= 10) {
        setPaymentNotice("Payment is still processing. This page will not mark it complete until the server confirms.");
        return true;
      }
      return false;
    };

    void checkStatus().then((complete) => {
      if (complete || !active) return;
      const timer = window.setInterval(() => {
        void checkStatus().then((done) => {
          if (done) window.clearInterval(timer);
        });
      }, 3000);
      window.setTimeout(() => window.clearInterval(timer), 30_000);
    });

    return () => {
      active = false;
    };
  }, []);

  function openBooking(consultant: Consultant) {
    setSelectedConsultant(consultant);
    setSelectedDate("");
    setSelectedSlot("");
    setSlotResult(null);
    setAgenda("");
  }

  async function launchCheckout(bookingId: string, checkout: RazorpayCheckoutData) {
    const loaded = await loadRazorpayCheckout();
    if (!loaded || !window.Razorpay) throw new Error("Razorpay Checkout could not be loaded. Check your internet connection and try again.");
    const gateway = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: "Help Study Abroad",
      description: `Career consultation with ${checkout.name}`,
      order_id: checkout.orderId,
      prefill: { name: user?.name || "", email: user?.email || checkout.email, contact: phone || checkout.phone },
      theme: { color: "#1f5946" },
      handler: (response) => {
        void verifyBookingPaymentApi(bookingId, {
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }).then((confirmed) => {
          setPaymentNotice("Your payment is confirmed and your consultation is booked.");
          setBookings((current) => [confirmed, ...current.filter((item) => item._id !== confirmed._id)]);
          setPendingCheckout(null);
          setSelectedConsultant(null);
          toast.success("Consultation booked successfully.");
        }).catch(() => {
          setPaymentNotice("Payment was received. We are checking it with Razorpay; refresh this page shortly.");
        });
      },
      modal: { ondismiss: () => setPaymentNotice("Checkout closed. You can continue payment from this booking form.") },
    });
    gateway.on("payment.failed", (failure) => toast.error(failure.description || "Payment failed. Please try again."));
    gateway.open();
  }

  async function handleBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingCheckout) {
      setBooking(true);
      try { await launchCheckout(pendingCheckout.bookingId, pendingCheckout.checkout); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Unable to open Razorpay Checkout."); }
      finally { setBooking(false); }
      return;
    }
    if (!selectedConsultant || !selectedSlot || !user) return;
    setBooking(true);
    try {
      const result = await createBookingApi({
        consultantId: selectedConsultant._id,
        startAt: selectedSlot,
        name: user.name,
        email: user.email,
        phone,
        agenda: agenda.trim(),
      });
      setPendingCheckout({ bookingId: result.booking._id, checkout: result.checkout });
      await launchCheckout(result.booking._id, result.checkout);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
          ? error.response.data.message
          : error instanceof Error ? error.message : "Unable to start your booking. Please try again.";
      toast.error(message);
    } finally {
      setBooking(false);
    }
  }

  const upcomingBookings = bookings.filter((item) =>
    ["PENDING_PAYMENT", "PAID", "CONFIRMED"].includes(item.status),
  );

  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      <div className="mx-auto max-w-[1320px] px-5 py-7 md:px-8 md:py-9">
        <section className="mb-8 max-w-2xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-emerald-800/70">A fresh perspective</p>
          <h1 className="m-0 text-[clamp(28px,4vw,40px)] font-semibold leading-tight tracking-[-1px] text-[#17324a]">Make space for your next big move.</h1>
          <p className="mb-0 mt-3 max-w-xl text-[13px] leading-7 text-slate-500">
            Meet one-on-one with an experienced career consultant to get clear,
            practical guidance tailored to you.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800"><CheckCircle2 size={15} /> Personal, focused advice</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800"><CheckCircle2 size={15} /> Convenient online meetings</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800"><CheckCircle2 size={15} /> Clear next steps to take away</span>
          </div>
        </section>

        {paymentNotice && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#d9eadd] bg-[#f0f8f1] p-3 text-[11px] text-[#426b4d]" role="status">
            <CheckCircle2 size={17} /> {paymentNotice}
          </div>
        )}

        {upcomingBookings.length > 0 && (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <div><h2 className="m-0 text-sm font-semibold">Your consultations</h2><p className="mb-0 mt-1 text-[11px] text-[#89968e]">Bookings linked to your account.</p></div>
            </div>
            {upcomingBookings.map((item) => (
              <article className="mb-2 flex min-h-16 flex-wrap items-center gap-3 rounded-xl border border-[#e5ece7] bg-white p-3" key={item._id}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf5f0] text-[#1f5946]"><CalendarDays size={17} /></span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs text-[#35483d]">{item.consultant?.name || "Career consultant"}</strong>
                  <p className="mb-0 mt-1 text-[10px] text-[#849189]">{new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.startAt))}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[9px] font-semibold capitalize ${item.status === "CONFIRMED" ? "bg-[#eaf4ed] text-[#4e805d]" : "bg-[#f5f1e8] text-[#997b47]"}`}>
                  {statusLabel(item.status)}
                </span>
                {item.status === "CONFIRMED" && item.meetingUrl && (
                  <a className="inline-flex items-center gap-1 rounded-md bg-[#eff5f1] px-2 py-1.5 text-[10px] text-[#1f5946] no-underline" href={item.meetingUrl} rel="noreferrer" target="_blank">
                    <Video size={14} /> Join
                  </a>
                )}
              </article>
            ))}
          </section>
        )}

        <div className="mb-4 mt-8 flex items-end justify-between gap-4">
          <div><h2 className="m-0 text-base font-semibold">Meet your career experts</h2><p className="mb-0 mt-1 text-[11px] text-[#89968e]">Thoughtful people, ready to help you move forward.</p></div>
          <span className="text-[10px] text-[#89968e]">{consultants.length} {consultants.length === 1 ? "consultant" : "consultants"}</span>
        </div>

        {loading ? (
          <div className="grid min-h-[230px] place-items-center text-[#1f5946]"><LoaderCircle className="animate-spin" size={20} /></div>
        ) : consultants.length === 0 ? (
          <section className="grid min-h-[205px] justify-items-center content-center rounded-xl border border-dashed border-[#dce6df] bg-white p-6 text-center">
            <span className="grid size-[42px] place-items-center rounded-xl bg-[#edf5f0] text-[#1f5946]"><CalendarDays size={22} /></span>
            <h2 className="mb-0 mt-3 text-[13px] font-semibold text-[#34473b]">New consultation times are on the way</h2>
            <p className="mb-0 mt-1.5 text-[10px] text-[#89968e]">There aren’t any experts available to book right now. Check back soon.</p>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {consultants.map((consultant, index) => (
              <article className="flex min-h-[290px] flex-col rounded-xl border border-[#e6ede8] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg" key={consultant._id}>
                <div className={`grid size-[42px] place-items-center rounded-[13px] text-xs font-bold ${["bg-[#e6f0e9] text-[#3d7051]", "bg-[#f4ebe1] text-[#9a7247]", "bg-[#edeaf4] text-[#77658d]", "bg-[#e8eff2] text-[#527486]"][index % 4]}`}>
                  {consultant.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}
                </div>
                <p className="mb-1 mt-3 text-[9px] text-[#819087]">{consultant.title}</p>
                <h3 className="m-0 text-[15px] font-semibold text-[#172b26]">{consultant.name}</h3>
                <p className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-[#718078]">{consultant.bio || "An experienced partner for your next career step."}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {consultant.specialties.slice(0, 3).map((specialty) => (
                    <span className="rounded-full bg-[#f0f5f1] px-2 py-1 text-[8px] text-[#5a7363]" key={specialty}>{specialty}</span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#eff2f0] pt-3">
                  <div className="grid gap-1">
                    <strong className="text-sm text-[#172b26]">{money(consultant.priceCents, consultant.currency)}</strong>
                    <span className="inline-flex items-center gap-1 text-[8px] text-[#89958e]"><Clock3 size={12} /> {consultant.slotDurationMinutes || 60} minutes</span>
                  </div>
                  <button className="min-h-8 rounded-md bg-[#1f5946] px-3 text-[9px] font-semibold text-white hover:bg-[#164634]" onClick={() => openBooking(consultant)} type="button">
                    Choose a time
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-4 inline-flex items-center gap-1.5 text-[9px] text-[#96a199]">
          <MapPin size={13} /> Times are shown in each consultant’s local time zone.
        </div>
      </div>

      {selectedConsultant && (
        <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#16281f]/40 p-4" role="presentation">
          <section
            aria-labelledby="booking-modal-title"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-[485px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            role="dialog"
          >
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[1px] text-[#75877e]">BOOK YOUR SESSION</p>
                <h2 className="m-0 text-lg font-semibold tracking-tight text-[#172b26]" id="booking-modal-title">Time with {selectedConsultant.name}</h2>
              </div>
              <button className="grid size-[30px] shrink-0 place-items-center rounded-md bg-[#f3f6f3] text-[#6e7c73] hover:bg-[#e9efea]" aria-label="Close" onClick={() => setSelectedConsultant(null)} type="button">
                <X size={18} />
              </button>
            </header>
            <form className="grid gap-3" onSubmit={(event) => void handleBooking(event)}>
              <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
                <span>Choose a day</span>
                <input
                  className="h-10 w-full rounded-lg border border-[#e2e9e4] bg-white px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                  min={today}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setSelectedSlot("");
                  }}
                  required
                  type="date"
                  value={selectedDate}
                />
              </label>
              {selectedDate && (
                <fieldset className="m-0 border-0 p-0">
                  <legend className="mb-2 text-[10px] font-semibold text-[#596a60]">Available times · {selectedConsultant.timeZone}</legend>
                  <div className="flex flex-wrap gap-2">
                    {slotsLoading && (
                      <span className="inline-flex items-center gap-2 py-2 text-[10px] text-[#718078]"><LoaderCircle className="animate-spin" size={14} /> Loading available times…</span>
                    )}
                    {!slotsLoading && slotsError && (
                      <p className="my-1 text-[10px] text-[#b15e56]">{slotsError}</p>
                    )}
                    {!slotsLoading && !slotsError && slots.map((slot) => (
                      <button
                        aria-pressed={selectedSlot === slot.startAt}
                        className={`rounded-lg border px-3 py-2 text-[10px] ${selectedSlot === slot.startAt ? "border-[#71957e] bg-[#eff6f1] text-[#1f5946]" : "border-[#dfe8e2] bg-white text-[#5b6e62] hover:bg-[#eff6f1]"}`}
                        key={slot.startAt}
                        onClick={() => setSelectedSlot(slot.startAt)}
                        type="button"
                      >
                        {formatSlot(new Date(slot.startAt), selectedConsultant.timeZone)}
                      </button>
                    ))}
                    {!slotsLoading && !slotsError && slots.length === 0 && (
                      <p className="my-1 text-[10px] text-[#86938b]">No times are available that day. Choose another date.</p>
                    )}
                  </div>
                </fieldset>
              )}
              <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
                <span>Phone number (optional)</span>
                <input className="h-10 w-full rounded-lg border border-[#e2e9e4] bg-white px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                  maxLength={20}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+1 555 010 1234"
                  value={phone}
                />
              </label>
              <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
                <span>What would you like to discuss? (optional)</span>
                <textarea className="w-full resize-y rounded-lg border border-[#e2e9e4] bg-white px-3 py-2 text-xs font-normal leading-relaxed outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                  maxLength={1000}
                  onChange={(event) => setAgenda(event.target.value)}
                  placeholder="Share a little about what you’d like help with."
                  rows={3}
                  value={agenda}
                />
              </label>
              <div className="flex items-center justify-between border-t border-[#edf1ee] pt-3 text-[10px] text-[#708078]">
                <span>{selectedConsultant.slotDurationMinutes || 60}-minute career consultation</span>
                <strong className="text-sm text-[#172b26]">{money(selectedConsultant.priceCents, selectedConsultant.currency)}</strong>
              </div>
              <button
                className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#1f5946] text-[10px] font-semibold text-white hover:bg-[#164634] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={booking || (!selectedSlot && !pendingCheckout)}
                type="submit"
              >
                {booking ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {pendingCheckout ? "Continue payment" : "Continue to secure payment"}
              </button>
              <p className="-mt-1 flex items-center justify-center gap-1 text-[8px] text-[#91a097]">
                <Sparkles size={13} /> Your booking is confirmed by the payment provider, not this page.
              </p>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
