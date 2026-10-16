"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Plane,
  Search,
  Settings2,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import BrandLogo from "@/components/brand-logo";
import { getMeApi, logoutApi, type AuthUser } from "@/features/auth/auth.api";
import { getDashboardSummaryApi, type DashboardSummary } from "@/features/dashboard/dashboard.api";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI career coach", href: "/chat", icon: MessageCircle },
  { label: "My resumes", href: "/resumes", icon: FileText },
  { label: "Consultations", href: "/consultations", icon: CalendarDays },
  { label: "Study abroad", href: "/study-abroad", icon: Plane },
  { label: "My profile", href: "/profile", icon: UserRound },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;
    if (typeof response === "object" && response !== null && "data" in response) {
      const data = response.data;
      if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") return data.message;
    }
  }
  return "We couldn’t load your career overview. Please try again.";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const [userResponse, dashboardSummary] = await Promise.all([getMeApi(), getDashboardSummaryApi()]);
      setUser(userResponse.data.user);
      setSummary(dashboardSummary);
      setError("");
    } catch (requestError) {
      const status = typeof requestError === "object" && requestError !== null && "response" in requestError
        && typeof requestError.response === "object" && requestError.response !== null && "status" in requestError.response
        ? requestError.response.status : undefined;
      if (status === 401) {
        router.replace("/login");
        return;
      }
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void loadDashboard(); });
    return () => { active = false; };
  }, [loadDashboard]);

  async function handleLogout() {
    try {
      await logoutApi();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to log out. Please retry.");
    }
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] p-6"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-emerald-700" size={24} /><p className="mt-3 text-sm text-slate-500">Preparing your workspace…</p></div></main>;
  }

  if (error || !user || !summary) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] p-6"><section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Your workspace couldn’t load</h1><p className="my-3 text-sm leading-6 text-slate-500">{error || "We couldn’t find your account information."}</p><button className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900" onClick={() => void loadDashboard()} type="button">Try again</button></section></main>;
  }

  const appointment = summary.nextConsultation;
  const appointmentDate = appointment ? new Date(appointment.startAt) : null;
  const appointmentEnd = appointment ? new Date(appointment.endAt) : null;
  const quickLinks = navigation.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#172b45]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] flex-col border-r border-[#e7edf1] bg-white px-4 py-6 lg:flex">
        <Link aria-label="Help Study Abroad home" className="mb-9 flex items-center px-2 no-underline" href="/dashboard">
          <BrandLogo className="h-11 w-[190px]" />
        </Link>

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[1.5px] text-slate-400">Workspace</p>
        <nav aria-label="Workspace navigation" className="grid gap-1">
          {navigation.map(({ label, href, icon: Icon }, index) => (
            <Link aria-current={index === 0 ? "page" : undefined} className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium no-underline transition ${index === 0 ? "bg-[#eaf5ee] text-[#11664b]" : "text-slate-600 hover:bg-slate-50 hover:text-[#11664b]"}`} href={href} key={label}>
              <Icon size={17} strokeWidth={1.8} /><span className="flex-1">{label}</span>{index === 0 && <span className="size-1.5 rounded-full bg-emerald-700" />}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-[#e4eee9] bg-gradient-to-br from-[#f3faf5] via-white to-[#eff7fb] p-4">
          <div className="mb-3 grid size-9 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Compass size={18} /></div>
          <p className="m-0 text-[13px] font-semibold text-[#17384a]">A clearer next step</p>
          <p className="mb-3 mt-1 text-[11px] leading-[1.65] text-slate-500">Small, thoughtful actions can take your career somewhere new.</p>
          <Link className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 no-underline hover:text-emerald-950" href="/chat">Talk it through <ArrowRight size={13} /></Link>
        </div>
        <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f4ed] text-xs font-bold text-emerald-800">{initials(user.name)}</span>
          <div className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800">{user.name}</strong><span className="mt-0.5 block truncate text-[10px] text-slate-400">{user.email}</span></div>
          <button aria-label="Log out" className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={handleLogout} title="Log out" type="button"><LogOut size={15} /></button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-4 border-b border-[#e7edf1] bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="relative w-full max-w-[560px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input aria-label="Search workspace" className="h-10 w-full rounded-full border border-[#e3eaf0] bg-[#f8fafc] pl-10 pr-4 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-900/5" onChange={(event) => setSearch(event.target.value)} placeholder="Search your workspace…" value={search} />
            {search.trim() && <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">{quickLinks.length ? quickLinks.map(({ href, icon: Icon, label }) => <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-slate-600 no-underline hover:bg-emerald-50 hover:text-emerald-800" href={href} key={href} onClick={() => setSearch("")}><Icon size={16} />{label}<ArrowUpRight className="ml-auto" size={14} /></Link>) : <p className="px-3 py-3 text-xs text-slate-400">No matching workspace sections.</p>}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-full bg-[#f3f7f9] px-3 py-2 text-[11px] text-slate-500 sm:flex"><span className="size-1.5 rounded-full bg-emerald-500" />Your journey, at your pace</div>
            <button aria-label="Notifications" className="relative grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100" title="Notifications" type="button"><Bell size={18} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></button>
            <Link className="flex items-center gap-2.5 text-inherit no-underline" href="/profile"><span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#dcefe4] to-[#d8eaf3] text-xs font-bold text-[#24634e]">{initials(user.name)}</span><span className="hidden sm:block"><strong className="block max-w-32 truncate text-[11px] text-slate-800">{user.name}</strong><span className="text-[10px] text-slate-400">Your profile</span></span><Settings2 className="hidden text-slate-400 sm:block" size={14} /></Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-7 sm:px-7 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[1.7px] text-emerald-800/70">Your career, in motion</p><h1 className="m-0 text-[25px] font-semibold tracking-[-.8px] text-[#17324a] sm:text-[29px]">Hello, {user.name.split(" ")[0]} <span aria-hidden="true">👋</span></h1><p className="mb-0 mt-1 text-[13px] text-slate-500">Your dreams matter. Let’s make your next step feel clear.</p></div>
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#e3eaf0] bg-white px-3.5 py-2.5 text-[11px] text-slate-500 shadow-[0_2px_8px_rgb(15_35_55_/_3%)]"><CalendarDays size={15} className="text-emerald-700" />{dateLabel(new Date())}</div>
          </div>

          <section className="relative isolate mb-5 min-h-[295px] overflow-hidden rounded-[24px] border border-[#dcece3] bg-[linear-gradient(112deg,#f7fcf8_0%,#edf8f3_49%,#e8f4f8_100%)] px-6 py-7 sm:px-9 sm:py-8 lg:min-h-[315px] lg:px-10">
            <div aria-hidden="true" className="absolute -right-12 -top-28 -z-10 size-[440px] rounded-full border border-emerald-900/[.07] sm:right-10 sm:top-[-175px] sm:size-[560px] after:absolute after:inset-9 after:rounded-full after:border after:border-emerald-900/[.06] before:absolute before:inset-[76px] before:rounded-full before:border before:border-dashed before:border-emerald-900/[.10]" />
            <div aria-hidden="true" className="absolute -bottom-40 right-[12%] -z-10 size-[380px] rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="relative z-10 max-w-[540px]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/10 bg-white/75 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[1px] text-emerald-800"><Sparkles size={12} />A thoughtful career companion</span>
              <h2 className="mt-4 max-w-[480px] text-[clamp(32px,4vw,48px)] font-semibold leading-[1.03] tracking-[-1.9px] text-[#17334a]">Your next chapter<br />starts <span className="text-emerald-700">with you.</span></h2>
              <p className="mt-3 max-w-[430px] text-[13px] leading-6 text-[#536a76]">Get practical career guidance, build a stronger resume, and find expert support for the opportunities ahead.</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#087653] px-4 text-[11px] font-semibold text-white no-underline shadow-[0_7px_16px_rgb(8_118_83_/_17%)] transition hover:-translate-y-0.5 hover:bg-[#066547]" href="/chat"><MessageCircle size={15} />Talk to your AI career coach<ArrowRight size={14} /></Link>
                <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-800/20 bg-white/80 px-4 text-[11px] font-semibold text-emerald-900 no-underline transition hover:bg-white" href="/resumes"><FileText size={15} />Build your resume</Link>
              </div>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-[45%] sm:block">
              <div className="absolute right-[14%] top-[15%] grid aspect-square w-[min(25vw,230px)] place-items-center rounded-full border border-emerald-800/10 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,.97),rgba(206,235,220,.68)_60%,rgba(202,230,239,.52))] shadow-[inset_-14px_-10px_50px_rgb(35_120_85_/_10%),0_25px_60px_rgb(35_90_70_/_8%)]">
                <div className="absolute inset-[12%] rounded-full border border-dashed border-emerald-800/20" />
                <div className="absolute left-[23%] top-[25%] size-2 rounded-full bg-emerald-600 shadow-[0_0_0_6px_rgb(5_150_105_/_10%)]" />
                <div className="absolute bottom-[26%] right-[23%] size-2 rounded-full bg-sky-600 shadow-[0_0_0_6px_rgb(2_132_199_/_10%)]" />
                <div className="absolute left-[26%] top-[26%] h-[47%] w-[48%] rotate-[-35deg] rounded-[50%] border-t border-dashed border-emerald-700/35" />
                <div className="grid size-[38%] place-items-center rounded-[28%] bg-white/75 text-emerald-800 shadow-lg shadow-emerald-950/10 backdrop-blur"><Compass className="size-[55%]" strokeWidth={1.35} /></div>
              </div>
              <div className="absolute right-[50%] top-[22%] flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_12px_30px_rgb(20_60_45_/_9%)] backdrop-blur"><span className="grid size-8 place-items-center rounded-xl bg-[#e9f6ed] text-emerald-700"><WandSparkles size={16} /></span><span><strong className="block text-[10px] text-slate-700">Personalized guidance</strong><span className="text-[9px] text-slate-400">Built around your goals</span></span></div>
              <div className="absolute bottom-[17%] right-[8%] flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_12px_30px_rgb(20_60_45_/_9%)] backdrop-blur"><span className="grid size-8 place-items-center rounded-xl bg-[#eaf3fa] text-sky-700"><Plane size={16} /></span><span><strong className="block text-[10px] text-slate-700">Make your next move</strong><span className="text-[9px] text-slate-400">One step at a time</span></span></div>
              <Sparkles className="absolute right-[17%] top-[11%] text-amber-500" size={18} />
            </div>
          </section>

          <section aria-label="Your progress" className="mb-8 grid gap-3 sm:grid-cols-3">
            <StatCard href="/resumes" icon={<FileText size={18} />} label="Resumes created" value={summary.totalResumes} detail="Build a stronger profile" tone="green" />
            <StatCard href="/chat" icon={<MessageCircle size={18} />} label="Coach conversations" value={summary.totalChats} detail="Get guidance when you need it" tone="violet" />
            <StatCard href="/consultations" icon={<CalendarDays size={18} />} label="Upcoming consultations" value={summary.upcomingConsultations} detail={appointmentDate ? `Next session ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(appointmentDate)}` : "Book a focused expert session"} tone="amber" />
          </section>

          <section className="mb-8" aria-labelledby="services-title">
            <div className="mb-4 flex items-end justify-between gap-3"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-slate-400">Made for your next step</p><h2 className="m-0 text-[20px] font-semibold tracking-[-.5px] text-[#17324a]" id="services-title">Explore your services</h2><p className="mb-0 mt-1 text-xs text-slate-500">Everything you need to move forward with confidence.</p></div><Link className="hidden items-center gap-1 text-[11px] font-semibold text-emerald-800 no-underline sm:inline-flex" href="/profile">Complete your profile<ChevronRight size={14} /></Link></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <ServiceCard href="/chat" icon={<WandSparkles size={19} />} tone="green" eyebrow="AI powered guidance" title="AI career coach" description="Talk through career decisions, prepare for interviews, and turn your goals into a plan." action="Start a conversation" />
              <ServiceCard href="/resumes" icon={<FileText size={19} />} tone="blue" eyebrow="Your story, clearly told" title="Resume builder" description="Shape your experience into a polished resume that feels professional and true to you." action="Build your resume" />
              <ServiceCard href="/consultations" icon={<CalendarDays size={19} />} tone="violet" eyebrow="One-to-one support" title="Expert consultations" description="Book a focused conversation with a career consultant and leave with clear next steps." action="Explore consultants" />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,.7fr)]">
            <Card className="overflow-hidden rounded-2xl border-[#e5ebf0] bg-white p-0 shadow-[0_3px_14px_rgb(20_44_68_/_3%)]">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[1.2px] text-slate-400">A moment to look ahead</p><h2 className="m-0 text-[15px] font-semibold text-[#17324a]">Your next consultation</h2></div><span className="grid size-9 place-items-center rounded-xl bg-[#fff5e8] text-amber-700"><CalendarDays size={17} /></span></div>
              {appointment && appointmentDate && appointmentEnd ? <div className="flex flex-wrap items-center gap-4 px-5 py-5"><div className="grid size-14 shrink-0 content-center justify-items-center rounded-2xl bg-[#edf7f0] text-emerald-800"><span className="text-[9px] font-bold uppercase">{new Intl.DateTimeFormat("en", { month: "short" }).format(appointmentDate)}</span><strong className="text-xl leading-6">{new Intl.DateTimeFormat("en", { day: "2-digit" }).format(appointmentDate)}</strong></div><div className="min-w-0 flex-1"><strong className="block text-sm text-slate-800">{appointment.consultant?.name || "Career consultation"}</strong><span className="mt-1 block text-xs text-slate-500">{appointment.consultant?.title || "Your personal career session"}</span><span className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-500"><Clock3 size={13} />{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(appointmentDate)} – {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(appointmentEnd)}</span></div><Link className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 no-underline" href="/consultations">View booking<ChevronRight size={14} /></Link></div> : <div className="flex flex-col items-start gap-3 px-5 py-5 sm:flex-row sm:items-center"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f2f7f9] text-sky-700"><CalendarDays size={19} /></div><div className="flex-1"><strong className="text-xs text-slate-700">Nothing on your calendar just yet</strong><p className="mb-0 mt-1 text-[11px] text-slate-500">Meet with an expert when you’re ready to plan your next move.</p></div><Link className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe8e0] px-3 py-2 text-[10px] font-semibold text-emerald-800 no-underline hover:bg-emerald-50" href="/consultations">Find a time<ArrowRight size={13} /></Link></div>}
            </Card>
            <Card className="rounded-2xl border-[#e5ebf0] bg-white p-5 shadow-[0_3px_14px_rgb(20_44_68_/_3%)]"><div className="mb-3 flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[#f1edff] text-violet-700"><Check size={16} /></span><div><h2 className="m-0 text-[13px] font-semibold text-[#17324a]">A little momentum</h2><p className="m-0 text-[10px] text-slate-400">Your workspace, your pace</p></div></div><p className="mb-4 text-[11px] leading-[1.7] text-slate-500">You don’t have to map out everything today. Choose one small step and build from there.</p><Link className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 no-underline" href="/profile">Update your career profile<ArrowRight size={13} /></Link></Card>
          </section>

          <footer className="mt-8 flex items-center justify-between border-t border-[#e7edf1] pt-4 text-[10px] text-slate-400"><span>Thoughtful tools for your career journey.</span><Link className="inline-flex items-center gap-1 text-slate-500 no-underline hover:text-emerald-800" href="/profile"><CircleHelp size={12} />Help & profile</Link></footer>
        </main>
      </div>

      <nav aria-label="Mobile workspace navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-[#e5ebef] bg-white/95 px-1 pb-[max(5px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_22px_rgb(20_40_60_/_6%)] backdrop-blur lg:hidden">
        {navigation.map(({ label, href, icon: Icon }, index) => <Link aria-current={index === 0 ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[9px] font-medium no-underline ${index === 0 ? "text-emerald-800" : "text-slate-400"}`} href={href} key={href}><Icon size={17} strokeWidth={index === 0 ? 2.2 : 1.8} /><span>{label === "Overview" ? "Home" : label === "AI career coach" ? "Coach" : label === "My resumes" ? "Resumes" : label === "Consultations" ? "Sessions" : label === "Study abroad" ? "Explore" : "Profile"}</span></Link>)}
      </nav>
    </div>
  );
}

function StatCard({ href, icon, label, value, detail, tone }: { href: string; icon: React.ReactNode; label: string; value: number; detail: string; tone: "green" | "violet" | "amber" }) {
  const theme = { green: "bg-[#e8f5ed] text-emerald-800", violet: "bg-[#f0edff] text-violet-700", amber: "bg-[#fff4e4] text-amber-700" }[tone];
  return <Link className="group flex min-h-[112px] items-center gap-3.5 rounded-2xl border border-[#e4ebf0] bg-white px-4 py-4 no-underline shadow-[0_3px_12px_rgb(20_44_68_/_3%)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:px-5" href={href}><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${theme}`}>{icon}</span><span className="min-w-0 flex-1"><span className="block text-[11px] text-slate-500">{label}</span><strong className="mt-1 block text-[22px] leading-7 tracking-[-.5px] text-[#17324a]">{value}</strong><span className="mt-0.5 block truncate text-[10px] text-slate-400">{detail}</span></span><ChevronRight className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" size={16} /></Link>;
}

function ServiceCard({ href, icon, tone, eyebrow, title, description, action }: { href: string; icon: React.ReactNode; tone: "green" | "blue" | "violet"; eyebrow: string; title: string; description: string; action: string }) {
  const theme = {
    green: "from-[#f5fbf6] to-[#eff8f2] border-[#e3efe6] text-emerald-800 bg-[#e4f3e9]",
    blue: "from-[#f7fbfe] to-[#eef6fb] border-[#e2edf4] text-sky-800 bg-[#e5f1fa]",
    violet: "from-[#fbf9ff] to-[#f5f1fc] border-[#ebe5f5] text-violet-800 bg-[#eee8fb]",
  }[tone];
  return <Link className={`group relative isolate min-h-[205px] overflow-hidden rounded-2xl border bg-gradient-to-br p-5 no-underline transition hover:-translate-y-1 hover:shadow-[0_16px_35px_rgb(20_44_68_/_9%)] ${theme.split(" ").filter((item) => item.startsWith("border-")).join(" ")} ${theme.split(" ").filter((item) => item.startsWith("from-") || item.startsWith("to-")).join(" ")}`} href={href}><span aria-hidden="true" className="absolute -right-10 -top-12 -z-10 size-36 rounded-full border border-current opacity-[.07] after:absolute after:inset-5 after:rounded-full after:border after:border-current" /><span className={`grid size-10 place-items-center rounded-xl ${theme.split(" ").filter((item) => item.startsWith("bg-")).join(" ")} ${theme.split(" ").filter((item) => item.startsWith("text-")).join(" ")}`}>{icon}</span><p className="mb-1 mt-4 text-[9px] font-bold uppercase tracking-[1.3px] text-slate-400">{eyebrow}</p><h3 className="m-0 text-[15px] font-semibold tracking-[-.2px] text-[#17324a]">{title}</h3><p className="mb-0 mt-2 max-w-[310px] text-[11px] leading-[1.7] text-slate-500">{description}</p><span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800">{action}<ArrowRight className="transition group-hover:translate-x-1" size={13} /></span><ArrowUpRight className="absolute right-4 top-4 text-slate-300 transition group-hover:text-emerald-700" size={15} /></Link>;
}
