"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, BookOpenCheck, Building2, Check, Compass, Globe2, Landmark, LoaderCircle, Plane, Search, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getMeApi } from "@/features/auth/auth.api";

const destinations = [
  { country: "United States", flag: "🇺🇸", city: "New York · Boston · beyond", detail: "Explore a wide range of universities, fields, and campus experiences.", color: "from-[#eaf3ff] to-[#f5f8ff]", accent: "text-blue-700", mark: "US" },
  { country: "Canada", flag: "🇨🇦", city: "Toronto · Vancouver · beyond", detail: "Compare study options and learn what each path could look like for you.", color: "from-[#fff0ee] to-[#fff8f5]", accent: "text-rose-700", mark: "CA" },
  { country: "United Kingdom", flag: "🇬🇧", city: "London · Edinburgh · beyond", detail: "Find programs and start organizing the questions you want to ask.", color: "from-[#f1edff] to-[#faf8ff]", accent: "text-violet-700", mark: "UK" },
  { country: "Germany", flag: "🇩🇪", city: "Berlin · Munich · beyond", detail: "Get a first look at study destinations and the planning involved.", color: "from-[#fff6e8] to-[#fffbf4]", accent: "text-amber-700", mark: "DE" },
  { country: "Australia", flag: "🇦🇺", city: "Sydney · Melbourne · beyond", detail: "Explore a new setting for your studies and future opportunities.", color: "from-[#eaf8f4] to-[#f5fbf9]", accent: "text-emerald-700", mark: "AU" },
];

export default function StudyAbroadPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const matches = useMemo(() => destinations.filter((destination) => `${destination.country} ${destination.city}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  useEffect(() => {
    let active = true;
    getMeApi().then(() => { if (active) setAuthorized(true); }).catch(() => router.replace("/login"));
    return () => { active = false; };
  }, [router]);

  if (!authorized) return <main className="grid min-h-[65vh] place-items-center text-emerald-800"><LoaderCircle className="animate-spin" size={22}/></main>;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      <section className="relative isolate mb-8 overflow-hidden rounded-[24px] border border-[#dbe9f0] bg-[linear-gradient(110deg,#e9f4fb_0%,#eff8f6_48%,#e9f5ee_100%)] px-6 py-7 sm:px-9 sm:py-9">
        <div aria-hidden="true" className="absolute -right-12 -top-24 -z-10 size-[390px] rounded-full border border-sky-900/10 after:absolute after:inset-8 after:rounded-full after:border after:border-dashed after:border-emerald-900/15 before:absolute before:inset-16 before:rounded-full before:border before:border-sky-900/10" />
        <div className="max-w-[600px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/10 bg-white/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[1.2px] text-emerald-800"><Globe2 size={12} />Explore possibilities</span>
          <h1 className="mt-4 max-w-[560px] text-[clamp(30px,4vw,46px)] font-semibold leading-[1.04] tracking-[-1.6px] text-[#17324a]">A bigger world of<br /><span className="text-emerald-700">learning awaits.</span></h1>
          <p className="mt-3 max-w-[480px] text-[12px] leading-6 text-slate-600">Explore popular study destinations, collect your questions, and take your next step with a little more clarity.</p>
          <label className="mt-5 flex h-11 max-w-[470px] items-center gap-2.5 rounded-xl border border-white bg-white/90 px-3.5 shadow-sm focus-within:ring-4 focus-within:ring-emerald-900/5"><Search className="shrink-0 text-slate-400" size={16} /><input aria-label="Search destinations" className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Search countries or cities" value={query} /></label>
        </div>
        <div aria-hidden="true" className="absolute bottom-5 right-[7%] hidden h-[170px] w-[300px] items-center justify-center sm:flex">
          <div className="grid size-36 place-items-center rounded-full border border-white/80 bg-white/55 text-sky-800 shadow-[inset_-10px_-8px_35px_rgb(26_120_100_/_12%),0_16px_45px_rgb(24_72_90_/_9%)]"><Globe2 size={82} strokeWidth={0.9} /></div>
          <Plane className="absolute right-[13%] top-[19%] rotate-[-18deg] text-emerald-800" size={26} />
          <div className="absolute bottom-[7%] left-[4%] flex items-center gap-2 rounded-xl border border-white bg-white/90 px-3 py-2 shadow-md"><span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Compass size={15} /></span><span className="text-[9px] font-semibold text-slate-600">Your journey, your pace</span></div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-[9px] font-bold uppercase tracking-[1.4px] text-slate-400">Start exploring</p><h2 className="m-0 text-[20px] font-semibold tracking-[-.4px] text-[#17324a]">Popular destinations</h2><p className="mb-0 mt-1 text-[11px] text-slate-500">A starting point for your own research and plans.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] text-slate-500 ring-1 ring-slate-200">{matches.length} destinations</span></div>

      {matches.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{matches.map((destination) => <Card className="overflow-hidden rounded-2xl border-[#e5ebef] bg-white p-0 shadow-[0_3px_14px_rgb(20_44_68_/_3%)] transition hover:-translate-y-0.5 hover:shadow-lg" key={destination.country}>
        <div className={`relative flex h-[145px] items-center justify-between overflow-hidden bg-gradient-to-br px-5 ${destination.color}`}>
          <div aria-hidden="true" className="absolute -right-5 -top-16 size-52 rounded-full border border-current/10 after:absolute after:inset-7 after:rounded-full after:border after:border-dashed after:border-current/15" />
          <div className="relative z-10"><span className="inline-grid size-10 place-items-center rounded-full bg-white/85 text-2xl shadow-sm">{destination.flag}</span><p className="mb-0 mt-3 text-[9px] font-semibold uppercase tracking-[1px] text-slate-500">Study destination</p></div>
          <div className={`relative z-10 mr-4 grid size-[94px] place-items-center rounded-[28px] border border-white/80 bg-white/55 ${destination.accent} shadow-sm`}><Landmark size={42} strokeWidth={1.1} /><span className="absolute -bottom-2 -right-2 rounded-md border border-white bg-white px-1.5 py-1 text-[8px] font-bold text-slate-500 shadow-sm">{destination.mark}</span></div>
          <Sparkles className="absolute bottom-5 right-[44%] text-amber-500/80" size={14} />
        </div>
        <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="m-0 text-[15px] font-semibold text-[#17324a]">{destination.country}</h3><p className="mb-0 mt-1 text-[10px] text-slate-400">{destination.city}</p></div><Building2 className="mt-1 text-slate-300" size={16} /></div><p className="mb-4 mt-3 min-h-10 text-[11px] leading-[1.65] text-slate-500">{destination.detail}</p><button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-800/20 px-3 text-[10px] font-semibold text-emerald-800 transition hover:bg-emerald-50" onClick={() => setSelected(selected === destination.country ? null : destination.country)} type="button">{selected === destination.country ? "Hide details" : "Explore destination"}<ArrowRight size={13} /></button>
          {selected === destination.country && <div className="mt-4 rounded-xl border border-[#e7edf1] bg-[#f8fafb] p-3.5"><p className="mb-2 text-[10px] font-semibold text-slate-700">A few useful first steps</p><ul className="m-0 grid gap-1.5 p-0 text-[10px] leading-relaxed text-slate-500"><li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-emerald-700" size={12} />Write down the subjects and programs you want to explore.</li><li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-emerald-700" size={12} />Compare official university information and requirements.</li><li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-emerald-700" size={12} />Talk through your plans with a career or education consultant.</li></ul><Link className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 no-underline" href="/consultations">Find an expert<ArrowUpRight size={12} /></Link></div>}
        </div>
      </Card>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><Search className="mx-auto text-slate-300" size={22} /><p className="mb-0 mt-3 text-sm font-semibold text-slate-700">No destinations found</p><button className="mt-2 text-xs font-medium text-emerald-800" onClick={() => setQuery("")} type="button">Clear search</button></div>}

      <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#e5ebef] bg-white p-5 sm:flex-row sm:items-center sm:p-6"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eff5ff] text-blue-700"><BookOpenCheck size={21} /></span><div className="flex-1"><h2 className="m-0 text-[13px] font-semibold text-[#17324a]">Planning is easier when your story is clear</h2><p className="mb-0 mt-1 text-[11px] text-slate-500">Prepare your resume or talk through your next step with your career coach.</p></div><div className="flex flex-wrap gap-2"><Link className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-800 px-3 text-[10px] font-semibold text-white no-underline hover:bg-emerald-900" href="/resumes">Open resume builder<ArrowRight size={13} /></Link><Link className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 no-underline hover:bg-slate-50" href="/chat">Ask the career coach</Link></div></section>
    </main>
  );
}
