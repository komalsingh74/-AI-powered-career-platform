"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, LayoutDashboard, MessageCircle, Plane, UserRound } from "lucide-react";
import BrandLogo from "@/components/brand-logo";

const links = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI career coach", href: "/chat", icon: MessageCircle },
  { label: "My resumes", href: "/resumes", icon: FileText },
  { label: "Consultations", href: "/consultations", icon: CalendarDays },
  { label: "Study abroad", href: "/study-abroad", icon: Plane },
  { label: "My profile", href: "/profile", icon: UserRound },
];

export default function WorkspaceChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usesOwnWorkspace = pathname === "/" || pathname === "/dashboard" || pathname.startsWith("/chat") || pathname.endsWith("/preview") || pathname === "/login" || pathname === "/register";

  if (usesOwnWorkspace) return children;

  return (
    <div className="min-h-screen bg-[#f7f9fb] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] shrink-0 flex-col border-r border-[#e6edf1] bg-white px-4 py-6 lg:flex">
        <Link aria-label="Help Study Abroad home" className="mb-9 flex items-center px-2 no-underline" href="/dashboard">
          <BrandLogo className="h-11 w-[190px]" />
        </Link>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[1.4px] text-slate-400">Workspace</p>
        <nav aria-label="Workspace navigation" className="grid gap-1">
          {links.map(({ label, href, icon: Icon }) => {
            const active = href === "/resumes" ? pathname.startsWith("/resumes") : pathname === href;
            return <Link aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[12px] font-medium no-underline transition ${active ? "bg-[#eaf5ee] text-[#11664b]" : "text-slate-600 hover:bg-slate-50 hover:text-[#11664b]"}`} href={href} key={href}><Icon size={17} strokeWidth={1.8} />{label}{active && <span className="ml-auto size-1.5 rounded-full bg-emerald-700" />}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-[#e4eee9] bg-gradient-to-br from-[#f3faf5] to-[#eff7fb] p-4"><p className="m-0 text-[12px] font-semibold text-[#17384a]">Keep moving forward</p><p className="mb-3 mt-1 text-[10px] leading-relaxed text-slate-500">Your goals, resume, and expert support—all in one place.</p><Link className="text-[10px] font-semibold text-emerald-800 no-underline" href="/dashboard">Back to overview →</Link></div>
      </aside>

      <div className="min-h-screen min-w-0 flex-1 pb-16 lg:ml-[258px] lg:pb-0">
        <header className="flex h-[58px] items-center justify-between border-b border-[#e6edf1] bg-white/90 px-5 backdrop-blur sm:px-8">
          <Link className="text-[11px] text-slate-400 no-underline hover:text-emerald-800" href="/dashboard">Workspace <span className="px-1.5 text-slate-300">/</span><span className="font-semibold text-slate-600">{links.find((item) => item.href === (pathname.startsWith("/resumes") ? "/resumes" : pathname))?.label || "Your next step"}</span></Link>
          <Link aria-label="Open your profile" className="grid size-8 place-items-center rounded-full bg-[#e8f4ed] text-emerald-800 transition hover:ring-4 hover:ring-emerald-900/5" href="/profile"><UserRound size={15} /></Link>
        </header>
        {children}
      </div>

      <nav aria-label="Mobile workspace navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-[#e5ebef] bg-white/95 px-1 pb-[max(5px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_22px_rgb(20_40_60_/_6%)] backdrop-blur lg:hidden">
        {links.map(({ label, href, icon: Icon }) => { const active = href === "/resumes" ? pathname.startsWith("/resumes") : pathname === href; return <Link aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[8px] font-medium no-underline ${active ? "text-emerald-800" : "text-slate-400"}`} href={href} key={href}><Icon size={16} /><span>{label === "Overview" ? "Home" : label === "AI career coach" ? "Coach" : label === "My resumes" ? "Resumes" : label === "Consultations" ? "Sessions" : label === "Study abroad" ? "Explore" : "Profile"}</span></Link>; })}
      </nav>
    </div>
  );
}
