"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Save, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import {
  getMeApi,
  updateMeApi,
  type AuthUser,
} from "@/features/auth/auth.api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getMeApi()
      .then((response) => {
        if (!active) return;
        const current = response.data.user;
        setUser(current);
        setName(current.name);
        setPhone(current.phone || "");
        setHeadline(current.profile?.headline || "");
        setLocation(current.profile?.location || "");
        setSkills((current.profile?.skills || []).join(", "));
        setExperienceYears(String(current.profile?.experienceYears || 0));
      })
      .catch(() => {
        if (active) router.replace("/login");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await updateMeApi({
        name: name.trim(),
        phone: phone.trim(),
        profile: {
          headline: headline.trim(),
          location: location.trim(),
          skills: skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          experienceYears: Number(experienceYears),
        },
      });
      setUser(response.data.user);
      toast.success("Your profile has been updated.");
    } catch {
      toast.error("We couldn’t save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-emerald-800"><LoaderCircle className="animate-spin" size={20} /></main>;
  }

  if (!user) return null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1120px] px-5 py-7 pb-24 md:px-8 md:py-9 lg:px-10">
      <header className="mb-7 flex items-center justify-between border-b border-[#e5ebef] pb-4 text-[11px] text-slate-500">
        <Link className="inline-flex items-center gap-2 text-inherit no-underline hover:text-emerald-800" href="/dashboard"><ArrowLeft size={15} /> Back to workspace</Link>
        <span className="inline-flex items-center gap-2"><UserRound size={15} /> Your profile</span>
      </header>
      <section className="mb-7 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eaf3ff] text-blue-700"><UserRound size={19} /></span>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.4px] text-emerald-800/70">YOUR ACCOUNT</p>
          <h1 className="m-0 text-[clamp(24px,3vw,31px)] font-semibold tracking-[-.8px] text-[#17324a]">Make your profile your own.</h1>
          <p className="mb-0 mt-2 text-[12px] text-slate-500">Keep the details that support your career journey up to date.</p>
        </div>
      </section>
      <form className="overflow-hidden rounded-[22px] border border-[#e5ebef] bg-white shadow-[0_8px_30px_rgb(20_44_68_/_4%)]" onSubmit={handleSubmit}>
        <section className="border-b border-[#edf1ee] p-5 sm:p-7">
          <h2 className="m-0 text-[14px] font-semibold text-[#17324a]">Personal details</h2>
          <p className="mb-5 mt-1 text-[11px] text-slate-500">We use these details to personalize your workspace.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#596a60]">
              <span>Full name</span>
              <input
                className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-sm font-normal outline-none disabled:bg-[#f7f9f7] focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                maxLength={80}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#596a60]">
              <span>Email address</span>
              <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-sm font-normal outline-none disabled:bg-[#f7f9f7]" disabled type="email" value={user.email} />
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#596a60] sm:col-span-2">
              <span>Phone number</span>
              <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-sm font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                maxLength={20}
                onChange={(event) => setPhone(event.target.value)}
                value={phone}
              />
            </label>
          </div>
        </section>
        <section className="border-b border-[#edf1ee] p-5 sm:p-7">
          <h2 className="m-0 text-[14px] font-semibold text-[#17324a]">Career profile</h2>
          <p className="mb-5 mt-1 text-[11px] text-slate-500">A few details help us make your guidance more relevant.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#596a60] sm:col-span-2">
              <span>Professional headline</span>
              <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-sm font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                maxLength={160}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="Product designer focused on accessible experiences"
                value={headline}
              />
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#596a60]">
              <span>Location</span>
              <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-sm font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                maxLength={120}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, country"
                value={location}
              />
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#596a60]">
              <span>Years of experience</span>
              <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-sm font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                max={60}
                min={0}
                onChange={(event) => setExperienceYears(event.target.value)}
                type="number"
                value={experienceYears}
              />
            </label>
            <label className="grid gap-1.5 text-[11px] font-semibold text-[#596a60] sm:col-span-2">
              <span>Skills</span>
              <textarea className="resize-y rounded-lg border border-[#e2e9e4] px-3 py-2.5 text-sm font-normal leading-relaxed outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                onChange={(event) => setSkills(event.target.value)}
                placeholder="Separate skills with commas"
                rows={3}
                value={skills}
              />
            </label>
          </div>
        </section>
        <footer className="flex justify-end bg-[#f8fafb] p-4 sm:px-7">
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-70" disabled={saving} type="submit">
            {saving ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}
            {saving ? "Saving…" : "Save profile"}
          </button>
        </footer>
      </form>
    </main>
  );
}
