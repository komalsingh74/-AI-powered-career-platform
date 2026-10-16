import Link from "next/link";
import Image from "next/image";
import { LockKeyhole, Sparkles } from "lucide-react";
import BrandLogo from "@/components/brand-logo";

export default function AuthLayout({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  const isLogin = title.toLowerCase().includes("welcome");
  return (
    <main className="grid min-h-screen bg-[#f7fafc] lg:grid-cols-[1.04fr_.96fr]">
      <section className="relative flex min-h-[560px] flex-col overflow-hidden border-b border-[#e3edf0] bg-[linear-gradient(145deg,#f8fcfa_0%,#edf7f3_54%,#e7f3f8_100%)] px-6 py-6 sm:px-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-[clamp(32px,6vw,88px)] lg:py-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-1/4 size-[470px] rounded-full border border-emerald-900/[.07] after:absolute after:inset-10 after:rounded-full after:border after:border-dashed after:border-emerald-900/[.09] before:absolute before:inset-20 before:rounded-full before:border before:border-emerald-900/[.07]" />
        <Link aria-label="Help Study Abroad home" className="relative z-10 flex w-fit items-center no-underline" href="/">
          <BrandLogo className="h-12 w-[196px]" />
        </Link>
        <div className="relative z-10 my-auto flex w-full flex-1 flex-col justify-center py-6 lg:min-h-0">
          <p className="relative z-20 mb-0 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1px] text-emerald-800 shadow-sm"><Sparkles size={13} />Your next chapter starts here</p>
          <div className="relative mx-auto mt-2 h-[min(68vh,620px)] min-h-[360px] w-full max-w-[620px] sm:min-h-[480px] lg:min-h-[520px]">
            <div aria-hidden="true" className="absolute inset-x-[8%] bottom-[4%] top-[12%] rounded-[48%] bg-[radial-gradient(ellipse_at_50%_46%,rgba(255,255,255,.94)_0%,rgba(225,242,233,.72)_53%,rgba(224,240,247,.24)_76%,transparent_77%)]" />
            <div aria-hidden="true" className="absolute bottom-[7%] left-1/2 aspect-square w-[min(78%,420px)] -translate-x-1/2 rounded-full border border-emerald-900/[.08]" />
            <Image alt="A graduate proudly holding her diploma" className="absolute inset-0 size-full object-contain object-bottom drop-shadow-[0_22px_28px_rgba(20,55,42,.12)]" fill priority sizes="(max-width: 1024px) 90vw, 620px" src="/auth-graduate.png" />
            <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/90 bg-white/85 px-4 py-2 text-[10px] font-semibold text-[#28644d] shadow-[0_10px_25px_rgba(20,55,42,.08)] backdrop-blur sm:text-xs">A brighter future starts with your next step</div>
          </div>
        </div>
        <span className="relative z-10 text-[10px] text-slate-400">Thoughtful tools for wherever you are in your career.</span>
      </section>
      <section className="grid min-h-[560px] place-items-center px-5 py-10 sm:px-9 lg:min-h-screen lg:px-12">
        <div className="w-full max-w-[420px] rounded-[26px] border border-[#e6edf1] bg-white p-6 shadow-[0_20px_70px_rgb(20_50_70_/_8%)] sm:p-8">
          <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#f4f7f8] p-1 text-center text-[11px] font-semibold"><Link className={`rounded-lg py-2.5 no-underline transition ${isLogin ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} href="/login">Sign in</Link><Link className={`rounded-lg py-2.5 no-underline transition ${!isLogin ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`} href="/register">Create account</Link></div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-emerald-800/70">Welcome to Help Study Abroad</p><h2 className="m-0 text-[27px] font-semibold tracking-[-.8px] text-[#17324a]">{title}</h2><p className="mb-7 mt-2 text-[12px] leading-relaxed text-slate-500">{description}</p>
          {children}
          <p className="mt-6 flex justify-center gap-1.5 text-[10px] text-slate-400"><LockKeyhole size={12} />Your account details are kept private.</p>
        </div>
      </section>
    </main>
  );
}
