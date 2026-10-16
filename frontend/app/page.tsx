import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import {
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const features = [
  "Build a resume that reflects your strengths",
  "Get practical guidance for your next move",
  "Keep your career progress in one place",
];

const workspaceItems = [
  { icon: FileText, title: "Your resume", detail: "Make your experience stand out" },
  { icon: MessageCircle, title: "Career coaching", detail: "Get help with your next big step" },
  { icon: CalendarDays, title: "Expert sessions", detail: "Book time with a career consultant" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fcfdfb] lg:grid lg:grid-cols-2">
      <section className="relative flex min-h-[650px] flex-col overflow-hidden px-6 py-7 sm:px-10 lg:min-h-screen lg:px-[clamp(36px,7vw,104px)] lg:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/3 size-[420px] rounded-full bg-[#eaf3ec] blur-3xl" />
        <Link href="/" aria-label="Help Study Abroad home" className="relative z-10 flex w-fit items-center">
          <BrandLogo className="h-12 w-[190px]" />
        </Link>

        <div className="relative z-10 my-auto max-w-[520px] py-16">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfe9e1] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#426b56] shadow-sm">
            <Sparkles size={14} /> A little support for your next chapter
          </p>
          <h1 className="m-0 max-w-[520px] text-[clamp(42px,5.5vw,68px)] font-semibold leading-[1.04] tracking-[-3px] text-[#182b25]">
            Your next career move, <span className="text-[#287354]">starts here.</span>
          </h1>
          <p className="mt-6 max-w-[440px] text-[16px] leading-7 text-[#6d7d74]">
            Bring your goals, ideas, and experience together. Help Study Abroad helps you find a clear next step and move forward with confidence.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#185b46] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgb(24_91_70_/_18%)] transition hover:-translate-y-0.5 hover:bg-[#124936]">
              Create your free account <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#dce6df] bg-white px-5 text-sm font-semibold text-[#29483a] transition hover:border-[#b8cebf] hover:bg-[#f6faf7]">
              Sign in
            </Link>
          </div>
          <div className="mt-9 grid gap-3">
            {features.map((feature) => (
              <p className="m-0 flex items-center gap-3 text-sm text-[#53665b]" key={feature}>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eaf3ec] text-[#287354]"><Check size={14} /></span>
                {feature}
              </p>
            ))}
          </div>
        </div>
        <p className="relative z-10 m-0 text-xs text-[#98a59d]">© 2026 Help Study Abroad. Thoughtful tools for your career.</p>
      </section>

      <aside className="relative flex min-h-[540px] items-center overflow-hidden bg-[#185b46] px-6 py-16 text-white sm:px-10 lg:min-h-screen lg:px-[clamp(36px,6vw,92px)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 size-[520px] rounded-full border border-white/10 after:absolute after:inset-12 after:rounded-full after:border after:border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-28 size-[400px] rounded-full bg-[#54aa7d]/20 blur-3xl" />
        <div className="relative mx-auto w-full max-w-[500px] py-8">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/80">
            <Sparkles size={14} /> Your all-in-one career workspace
          </p>
          <h2 className="m-0 max-w-[490px] text-[clamp(28px,3.3vw,42px)] font-semibold leading-[1.15] tracking-[-1.4px]">
            Make space for the work and future you want.
          </h2>
          <p className="mb-0 mt-4 max-w-[420px] text-sm leading-6 text-white/70">
            Your story, coaching, and expert support—together in one thoughtful workspace.
          </p>
          <div className="mt-9 grid gap-3">
            {workspaceItems.map(({ icon: Icon, title, detail }, index) => (
              <article className={`flex items-center gap-4 rounded-2xl border p-4 ${index === 0 ? "border-white/70 bg-white text-[#182b25] shadow-xl shadow-black/10" : "border-white/10 bg-white/[0.06] backdrop-blur"}`} key={title}>
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${index === 0 ? "bg-[#edf5ef] text-[#185b46]" : "bg-white/10 text-white"}`}><Icon size={19} /></span>
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold">{title}</strong>
                  <span className={`mt-1 block text-xs ${index === 0 ? "text-[#718078]" : "text-white/60"}`}>{detail}</span>
                </span>
                {index === 0 && <span className="ml-auto rounded-full bg-[#edf5ef] px-2.5 py-1 text-[10px] font-semibold text-[#185b46]">Your workspace</span>}
              </article>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6 text-xs text-white/65">
            <span className="flex -space-x-2" aria-hidden="true">{[0, 1, 2].map((item) => <span className="size-7 rounded-full border-2 border-[#185b46] bg-gradient-to-br from-[#b5f0d4] to-[#43c99a]" key={item} />)}</span>
            A more focused way to move your career forward
          </div>
        </div>
      </aside>
    </main>
  );
}
