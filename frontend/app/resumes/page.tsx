"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileText,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  deleteResumeApi,
  listResumesApi,
  type Resume,
} from "@/features/resumes/resumes.api";

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadResumes = useCallback(async () => {
    try {
      const result = await listResumesApi(query);
      setResumes(result.resumes);
    } catch {
      toast.error("Unable to load resumes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadResumes();
    });
    return () => {
      active = false;
    };
  }, [loadResumes]);

  useEffect(() => {
    let active = true;
    import("@/features/auth/auth.api").then(({ getMeApi }) =>
      getMeApi().catch(() => {
        if (active) router.replace("/login");
      }),
    );
    return () => {
      active = false;
    };
  }, [router]);

  async function handleDelete(resume: Resume) {
    if (!window.confirm(`Delete “${resume.title}”? This cannot be undone.`)) return;
    try {
      await deleteResumeApi(resume._id);
      setResumes((current) => current.filter((item) => item._id !== resume._id));
      toast.success("Resume deleted.");
    } catch {
      toast.error("Unable to delete this resume. Please try again.");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1140px] px-5 py-10 md:px-8 md:py-12">
      <header className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1px] text-[#75877e]">Your professional story</p>
          <h1 className="m-0 text-[clamp(27px,4vw,34px)] font-bold tracking-tight text-[#172b26]">My resumes</h1>
          <p className="mb-0 mt-2 text-xs text-[#71817b]">Build, refine, and keep every version of your story close.</p>
        </div>
        <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#1f5946] px-4 text-xs font-semibold text-white no-underline hover:bg-[#164634]" href="/resumes/create">
          <Plus size={16} /> Create a resume
        </Link>
      </header>

      <section className="mt-7 flex items-center gap-3 rounded-xl border border-[#e0ebe4] bg-[#f2f7f3] p-4 sm:p-[18px]">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#1f5946]"><Sparkles size={18} /></div>
        <div>
          <strong className="text-xs text-[#294638]">A resume should sound like you—at your very best.</strong>
          <p className="mb-0 mt-1 text-[10px] text-[#73857b]">Start with the essentials, then shape the details as you go.</p>
        </div>
        <ArrowRight className="ml-auto shrink-0 text-[#83a18f]" size={17} />
      </section>

      <div className="mb-4 mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-baseline gap-2.5">
          <h2 className="m-0 text-[15px] font-semibold text-[#172b26]">All resumes</h2>
          <span className="text-[10px] text-[#95a19a]">{resumes.length} {resumes.length === 1 ? "document" : "documents"}</span>
        </div>
        <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-[#e4ebe6] bg-white px-3 text-[#8b9991] sm:w-[250px]">
          <Search size={15} className="shrink-0" />
          <input
            aria-label="Search resumes"
            className="w-full min-w-0 bg-transparent text-[11px] text-[#172b26] outline-none placeholder:text-[#a1aca5]"
            onChange={(event) => {
              setLoading(true);
              setQuery(event.target.value);
            }}
            placeholder="Search your resumes"
            type="search"
            value={query}
          />
        </label>
      </div>

      {loading ? (
        <div className="flex min-h-[55vh] items-center justify-center text-[#1f5946]"><LoaderCircle className="animate-spin" size={20} /></div>
      ) : resumes.length ? (
        <div className="grid gap-3">
          {resumes.map((resume) => (
            <article className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e5ebef] bg-white p-4 shadow-[0_3px_12px_rgb(20_44_68_/_3%)] transition hover:border-emerald-200 hover:shadow-md sm:gap-4 sm:px-5" key={resume._id}>
              <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${resume.template === "ATS_CLASSIC" ? "bg-slate-100 text-slate-600" : "bg-[#eaf3ff] text-blue-700"}`}><FileText size={19} /></div>
              <div className="min-w-[150px] flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="m-0 max-w-full truncate text-[12px] font-semibold text-[#17324a]">{resume.title}</h3><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-semibold text-emerald-800">{resume.template === "ATS_CLASSIC" ? "ATS Classic" : "Modern"}</span></div>
                <p className="mb-0 mt-1 text-[10px] text-slate-400">Updated {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(resume.updatedAt))}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex shrink-0 gap-1.5">
                  <button
                    aria-label={`Delete ${resume.title}`}
                    className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    onClick={() => void handleDelete(resume)}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                  <Link
                    aria-label={`Edit ${resume.title}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-800/20 bg-white px-3 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50"
                    href={`/resumes/${resume._id}/edit`}
                  >Edit <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="flex min-h-[310px] flex-col items-center justify-center rounded-xl border border-dashed border-[#dbe5de] bg-white p-8 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-[#edf5f0] text-[#1f5946]"><FileText size={22} /></span>
          <h2 className="mb-0 mt-4 text-[15px] font-semibold">{query ? "No matching resumes" : "Your next opportunity starts with a story"}</h2>
          <p className="mb-4 mt-2 max-w-[350px] text-[11px] leading-relaxed text-[#71817b]">
            {query
              ? "Try another title or clear your search."
              : "Create your first resume and shape a clear, confident picture of your experience."}
          </p>
          {!query && (
            <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#1f5946] px-4 text-xs font-semibold text-white no-underline hover:bg-[#164634]" href="/resumes/create">
              <Plus size={15} /> Create your first resume
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
