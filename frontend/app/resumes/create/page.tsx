"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { createResumeApi } from "@/features/resumes/resumes.api";

export default function CreateResumePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const resume = await createResumeApi({ title: title.trim(), content: { personalInformation: { name: name.trim(), email: email.trim(), headline: headline.trim() } } });
      toast.success("Your resume is ready to edit.");
      router.push(`/resumes/${resume._id}/edit`);
    } catch {
      toast.error("Unable to create your resume. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1200px] px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <Link className="inline-flex items-center gap-2 text-[11px] text-slate-500 no-underline hover:text-emerald-800" href="/resumes"><ArrowLeft size={15} /> Back to resumes</Link>
      <div className="mb-6 mt-6"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-emerald-800/70">Resume builder · Step 1 of 3</p><h1 className="m-0 text-[clamp(27px,4vw,36px)] font-semibold tracking-[-1px] text-[#17324a]">Let’s make a resume that feels like you.</h1><p className="mb-0 mt-2 text-[12px] text-slate-500">Start with a few details. You can refine every section later.</p></div>
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#e5ebef] bg-white p-3 sm:gap-4 sm:p-4">
        {[["01", "Your details"], ["02", "Experience"], ["03", "Review & style"]].map(([number, label], index) => <div className="flex items-center gap-2.5" key={number}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-400"}`}>{number}</span><span className={`hidden text-[10px] font-semibold sm:block ${index === 0 ? "text-emerald-900" : "text-slate-400"}`}>{label}</span>{index < 2 && <span className="ml-auto hidden h-px flex-1 bg-slate-200 sm:block" />}</div>)}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,.75fr)]">
        <form className="divide-y divide-[#edf1f4] rounded-2xl border border-[#e5ebef] bg-white px-5 shadow-[0_8px_28px_rgb(20_44_68_/_4%)] sm:px-8" onSubmit={handleSubmit}>
          <section className="grid gap-4 py-6 sm:grid-cols-[42px_1fr]"><span className="grid size-9 place-items-center rounded-full bg-[#eaf5ee] text-xs font-bold text-emerald-800">01</span><div><h2 className="m-0 text-[14px] font-semibold text-[#17324a]">Name this resume</h2><p className="mb-4 mt-1 text-[11px] text-slate-500">Choose a name that helps you keep track of this version.</p><label className="grid gap-1.5 text-[11px] font-semibold text-slate-600"><span>Resume name</span><input autoFocus className="h-10 rounded-lg border border-[#dfe7ed] px-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-900/10" maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Product Designer — 2026" required value={title} /></label></div></section>
          <section className="grid gap-4 py-6 sm:grid-cols-[42px_1fr]"><span className="grid size-9 place-items-center rounded-full bg-[#eaf5ee] text-xs font-bold text-emerald-800">02</span><div><h2 className="m-0 text-[14px] font-semibold text-[#17324a]">Introduce yourself</h2><p className="mb-4 mt-1 text-[11px] text-slate-500">These details will appear at the top of your resume.</p><div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[11px] font-semibold text-slate-600"><span>Full name</span><input className="h-10 rounded-lg border border-[#dfe7ed] px-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-900/10" maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Jordan Lee" required value={name} /></label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-slate-600"><span>Email address</span><input className="h-10 rounded-lg border border-[#dfe7ed] px-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-900/10" onChange={(event) => setEmail(event.target.value)} placeholder="jordan@example.com" required type="email" value={email} /></label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-slate-600 sm:col-span-2"><span>Professional headline</span><input className="h-10 rounded-lg border border-[#dfe7ed] px-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-900/10" maxLength={160} onChange={(event) => setHeadline(event.target.value)} placeholder="Product designer focused on accessible experiences" value={headline} /></label>
          </div></div></section>
          <div className="flex items-start gap-3 rounded-xl bg-[#f2f8fb] p-4"><Sparkles className="mt-0.5 shrink-0 text-sky-700" size={16}/><p className="m-0 text-[11px] leading-relaxed text-slate-500"><strong className="mb-1 block text-[#17324a]">Make it yours, one section at a time.</strong>You can switch templates and edit your story whenever you want.</p></div>
          <div className="flex flex-col-reverse justify-end gap-3 py-5 sm:flex-row"><Link className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 no-underline hover:bg-slate-50" href="/resumes">Cancel</Link><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-70" disabled={loading} type="submit">{loading ? <LoaderCircle className="animate-spin" size={15}/> : null}Continue to editor<ArrowRight size={15}/></button></div>
        </form>

        <aside className="grid gap-4 lg:sticky lg:top-[78px]">
          <section className="rounded-2xl border border-[#e5ebef] bg-white p-5 shadow-[0_5px_20px_rgb(20_44_68_/_4%)]"><div className="mb-4 flex items-center justify-between"><div><p className="mb-1 text-[9px] font-bold uppercase tracking-[1.3px] text-slate-400">Live preview</p><h2 className="m-0 text-[13px] font-semibold text-[#17324a]">Your resume header</h2></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-800">Modern</span></div><div className="mx-auto min-h-[260px] max-w-[270px] border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgb(20_44_68_/_8%)]"><div className="h-1.5 w-10 rounded bg-emerald-700"/><h3 className="mb-0 mt-5 truncate text-[15px] font-bold text-slate-800">{name || "Your name"}</h3><p className="mb-0 mt-1 truncate text-[8px] text-slate-500">{headline || "Professional headline"}</p><p className="mb-0 mt-1 truncate text-[8px] text-slate-400">{email || "your.email@example.com"}</p><div className="mt-5 h-px bg-slate-200"/><p className="mb-1 mt-4 text-[7px] font-bold tracking-[1px] text-emerald-800">EXPERIENCE</p><span className="block h-1 w-full rounded bg-slate-100"/><span className="mt-1.5 block h-1 w-4/5 rounded bg-slate-100"/><p className="mb-1 mt-4 text-[7px] font-bold tracking-[1px] text-emerald-800">EDUCATION</p><span className="block h-1 w-full rounded bg-slate-100"/><span className="mt-1.5 block h-1 w-3/4 rounded bg-slate-100"/></div><p className="mb-0 mt-4 text-center text-[10px] leading-relaxed text-slate-400">Your information stays editable in the next step.</p></section>
          <section className="rounded-2xl border border-[#dfece5] bg-gradient-to-br from-[#f1f9f4] to-[#f2f8fb] p-4"><div className="flex items-center gap-2"><Sparkles className="text-emerald-800" size={15}/><h3 className="m-0 text-[11px] font-semibold text-[#17324a]">A useful tip</h3></div><p className="mb-0 mt-2 text-[10px] leading-[1.7] text-slate-500">Use a clear title to keep track of different versions, like “Product Designer — 2026”.</p><span className="mt-3 inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-800"><FileText size={12}/>You can edit sections next</span></section>
        </aside>
      </div>
    </main>
  );
}
