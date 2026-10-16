"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  Bold,
  Eye,
  Italic,
  LoaderCircle,
  List,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  generateResumeApi,
  getResumeApi,
  updateResumeApi,
  type Resume,
  type ResumeEntry,
  type ResumeTemplate,
} from "@/features/resumes/resumes.api";

function getParagraphDocument(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    type: "doc",
    content: paragraphs.length
      ? paragraphs.map((paragraph) => ({
          type: "paragraph",
          content: [{ type: "text", text: paragraph }],
        }))
      : [{ type: "paragraph" }],
  };
}

export default function ResumeEditor({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [resume, setResume] = useState<Resume | null>(null);
  const [title, setTitle] = useState("");
  const [headline, setHeadline] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState<ResumeEntry[]>([]);
  const [education, setEducation] = useState<ResumeEntry[]>([]);
  const [projects, setProjects] = useState<ResumeEntry[]>([]);
  const [certifications, setCertifications] = useState<ResumeEntry[]>([]);
  const [achievements, setAchievements] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [template, setTemplate] = useState<ResumeTemplate>("MODERN");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-36 rounded-b-lg border border-[#e7ede8] p-3 text-[11px] leading-relaxed text-[#45564d] outline-none focus:border-[#81a18d] [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "aria-label": "Professional summary editor",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setSummary(currentEditor.getText({ blockSeparator: "\n\n" }));
    },
  });

  const loadResume = useCallback(async () => {
    try {
      const current = await getResumeApi(resumeId);
      setResume(current);
      setTitle(current.title);
      setTemplate(current.template);
      setName(current.content.personalInformation.name || "");
      setEmail(current.content.personalInformation.email || "");
      setPhone(current.content.personalInformation.phone || "");
      setLocation(current.content.personalInformation.location || "");
      setHeadline(current.content.personalInformation.headline || "");
      setTargetRole(current.content.personalInformation.headline || "");
      setSkills(current.content.skills.join(", "));
      setSummary(current.content.summary || "");
      setExperience(current.content.experience || []);
      setEducation(current.content.education || []);
      setProjects(current.content.projects || []);
      setCertifications(current.content.certifications || []);
      setAchievements((current.content.achievements || []).join("\n"));
    } catch {
      toast.error("Unable to open this resume.");
      router.replace("/resumes");
    } finally {
      setLoading(false);
    }
  }, [resumeId, router]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadResume();
    });
    return () => {
      active = false;
    };
  }, [loadResume]);

  useEffect(() => {
    if (resume && editor) {
      editor?.commands.setContent(
        getParagraphDocument(resume.content.summary || ""),
        { emitUpdate: false },
      );
    }
  }, [editor, resume]);

  async function saveResume() {
    if (!resume) return;
    setSaving(true);
    try {
      const updated = await updateResumeApi(resume._id, {
        title: title.trim(),
        template,
        content: {
          personalInformation: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            location: location.trim(),
            headline: headline.trim(),
            links: resume.content.personalInformation.links || [],
          },
          summary,
          education,
          experience,
          skills: skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          projects,
          certifications,
          achievements: achievements
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });
      setResume(updated);
      toast.success("Resume saved.");
    } catch {
      toast.error("Your changes couldn’t be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function generateWithAi() {
    if (!resume) return;
    setGenerating(true);
    try {
      const generated = await generateResumeApi(resume._id, targetRole);
      setResume(generated);
      setSummary(generated.content.summary);
      setExperience(generated.content.experience);
      editor?.commands.setContent(
        getParagraphDocument(generated.content.summary),
        { emitUpdate: false },
      );
      toast.success("Your resume draft has been refreshed. Review it before using.");
    } catch {
      toast.error("AI couldn’t draft this resume. Check the AI configuration and try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading || !editor) {
    return (
      <main className="flex min-h-[55vh] items-center justify-center gap-2.5 text-xs text-[#1f5946]">
        <LoaderCircle className="animate-spin" size={20} />
        <span>Opening your resume…</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9f7]">
      <header className="sticky top-0 z-20 flex min-h-[60px] items-center justify-between gap-3 border-b border-[#e8eeea] bg-white/95 px-4 backdrop-blur sm:px-8">
        <Link className="inline-flex items-center gap-2 text-[11px] text-[#708078] no-underline hover:text-[#1f5946]" href="/resumes">
          <ArrowLeft size={15} /> All resumes
        </Link>
        <div className="flex items-center gap-2">
          <Link className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#dce6df] bg-white px-3 text-[11px] font-semibold text-[#52665c] no-underline hover:bg-[#f4f8f5]" href={`/resumes/${resumeId}/preview`}>
            <Eye size={15} /> Preview
          </Link>
          <button
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#1f5946] px-3 text-[11px] font-semibold text-white hover:bg-[#164634] disabled:opacity-70"
            disabled={saving}
            onClick={() => void saveResume()}
            type="button"
          >
            {saving ? (
              <LoaderCircle className="animate-spin" size={15} />
            ) : (
              <Save size={15} />
            )}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#e8eeea] bg-white p-5 sm:flex-row sm:items-start">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1px] text-[#75877e]">Resume editor</p>
              <input
                aria-label="Resume title"
                className="w-full border-0 bg-transparent p-0 text-xl font-semibold tracking-tight text-[#172b26] outline-none placeholder:text-[#9aa69f]"
                maxLength={100}
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
              <p className="mb-0 mt-2 text-[10px] text-[#85938c]">
                Your information stays yours. Update and save whenever you’re ready.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[9px] text-[#819087]">
              <span className="size-1.5 rounded-full bg-[#70a77f]" /> Saved to your workspace
            </span>
          </div>

          <section className="rounded-xl border border-[#e8eeea] bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#edf5f0] text-[10px] font-bold text-[#1f5946]">01</span>
              <div>
                <h2 className="m-0 text-[13px] font-semibold text-[#172b26]">Personal information</h2>
                <p className="mb-0 mt-1 text-[10px] text-[#8a9891]">Help the right people find and contact you.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
                <span>Full name</span>
                <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
                <span>Professional headline</span>
                <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10" value={headline} onChange={(event) => setHeadline(event.target.value)} />
              </label>
              <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
                <span>Email address</span>
                <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
                <span>Phone</span>
                <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60] sm:col-span-2">
                <span>Location</span>
                <input className="h-10 rounded-lg border border-[#e2e9e4] px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10" value={location} onChange={(event) => setLocation(event.target.value)} />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-[#e8eeea] bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#edf5f0] text-[10px] font-bold text-[#1f5946]">02</span>
              <div>
                <h2 className="m-0 text-[13px] font-semibold text-[#172b26]">Professional summary</h2>
                <p className="mb-0 mt-1 text-[10px] text-[#8a9891]">A clear, concise introduction to the value you bring.</p>
              </div>
            </div>
            <div className="flex gap-1 rounded-t-lg border border-[#e7ede8] bg-[#fbfcfb] p-1.5" role="toolbar" aria-label="Summary formatting">
              <button
                aria-label="Bold"
                aria-pressed={editor.isActive("bold")}
                className={`grid size-7 place-items-center rounded text-[#697970] hover:bg-[#eaf2ed] hover:text-[#1f5946] ${editor.isActive("bold") ? "bg-[#eaf2ed] text-[#1f5946]" : ""}`}
                onClick={() => editor.chain().focus().toggleBold().run()}
                type="button"
              >
                <Bold size={15} />
              </button>
              <button
                aria-label="Italic"
                aria-pressed={editor.isActive("italic")}
                className={`grid size-7 place-items-center rounded text-[#697970] hover:bg-[#eaf2ed] hover:text-[#1f5946] ${editor.isActive("italic") ? "bg-[#eaf2ed] text-[#1f5946]" : ""}`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                type="button"
              >
                <Italic size={15} />
              </button>
              <button
                aria-label="Bullet list"
                aria-pressed={editor.isActive("bulletList")}
                className={`grid size-7 place-items-center rounded text-[#697970] hover:bg-[#eaf2ed] hover:text-[#1f5946] ${editor.isActive("bulletList") ? "bg-[#eaf2ed] text-[#1f5946]" : ""}`}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                type="button"
              >
                <List size={15} />
              </button>
            </div>
            <EditorContent editor={editor} />
            {!summary && (
              <span className="pointer-events-none -mt-32 block p-3 text-[11px] text-[#a1aca5]">
                Write a few sentences about your experience, strengths, and the
                work you’re excited to do next.
              </span>
            )}
          </section>

          <section className="rounded-xl border border-[#e8eeea] bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#edf5f0] text-[10px] font-bold text-[#1f5946]">03</span>
              <div>
                <h2 className="m-0 text-[13px] font-semibold text-[#172b26]">Skills</h2>
                <p className="mb-0 mt-1 text-[10px] text-[#8a9891]">Separate each skill with a comma.</p>
              </div>
            </div>
            <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
              <span className="sr-only">Skills</span>
              <textarea
                className="min-h-[74px] w-full resize-y rounded-lg border border-[#e2e9e4] px-3 py-2.5 text-xs font-normal leading-relaxed outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                onChange={(event) => setSkills(event.target.value)}
                placeholder="Product strategy, User research, Figma, Prototyping"
                rows={3}
                value={skills}
              />
            </label>
          </section>

          <ResumeEntrySection
            description="Make your impact, responsibilities, and growth easy to understand."
            fields={[
              { key: "title", label: "Job title" },
              { key: "company", label: "Company" },
              { key: "location", label: "Location" },
              { key: "startDate", label: "Start date" },
              { key: "endDate", label: "End date" },
              { key: "description", label: "What you accomplished", multiline: true },
            ]}
            onChange={setExperience}
            sectionNumber="04"
            title="Experience"
            value={experience}
          />
          <ResumeEntrySection
            description="Add your degree, training, or other relevant education."
            fields={[
              { key: "degree", label: "Degree or qualification" },
              { key: "school", label: "School or institution" },
              { key: "field", label: "Field of study" },
              { key: "startDate", label: "Start date" },
              { key: "endDate", label: "End date" },
              { key: "description", label: "Additional details", multiline: true },
            ]}
            onChange={setEducation}
            sectionNumber="05"
            title="Education"
            value={education}
          />
          <ResumeEntrySection
            description="Highlight projects that show how you approach your work."
            fields={[
              { key: "name", label: "Project name" },
              { key: "url", label: "Project link" },
              { key: "technologies", label: "Tools / technologies (comma-separated)" },
              { key: "description", label: "Project details", multiline: true },
            ]}
            onChange={setProjects}
            sectionNumber="06"
            title="Projects"
            value={projects}
          />
          <ResumeEntrySection
            description="Include certifications relevant to the role you want."
            fields={[
              { key: "name", label: "Certification" },
              { key: "issuer", label: "Issuing organization" },
              { key: "date", label: "Date" },
              { key: "description", label: "Additional details", multiline: true },
            ]}
            onChange={setCertifications}
            sectionNumber="07"
            title="Certifications"
            value={certifications}
          />
          <section className="rounded-xl border border-[#e8eeea] bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#edf5f0] text-[10px] font-bold text-[#1f5946]">08</span>
              <div>
                <h2 className="m-0 text-[13px] font-semibold text-[#172b26]">Achievements</h2>
                <p className="mb-0 mt-1 text-[10px] text-[#8a9891]">One measurable accomplishment per line.</p>
              </div>
            </div>
            <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
              <span className="sr-only">Achievements</span>
              <textarea
                className="min-h-[74px] w-full resize-y rounded-lg border border-[#e2e9e4] px-3 py-2.5 text-xs font-normal leading-relaxed outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                onChange={(event) => setAchievements(event.target.value)}
                placeholder={"Improved onboarding completion by 18%.\nRecognized with the 2025 team impact award."}
                rows={4}
                value={achievements}
              />
            </label>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-[#eee7d8] bg-[#fcfaf5] p-4 text-[#a7804c]">
            <Sparkles className="shrink-0" size={16} />
            <p className="m-0 text-[10px] leading-relaxed text-[#8b806c]">
              <strong className="mb-1 block text-[11px] text-[#655943]">Keep it specific and true to you.</strong> Clear,
              straightforward language works well for both people and applicant
              tracking systems.
            </p>
          </div>
        </section>

        <aside className="grid content-start gap-3 lg:sticky lg:top-[76px]">
          <section className="rounded-xl border border-[#e6eee7] bg-gradient-to-br from-white to-[#f7faf7] p-4">
            <p className="mb-3 text-[9px] font-bold tracking-[1px] text-[#92a097]">AI WRITING SUPPORT</p>
            <h2 className="m-0 text-[13px] font-semibold text-[#172b26]">Make your experience clearer</h2>
            <p className="mb-4 mt-1.5 text-[10px] leading-relaxed text-[#8a9891]">
              Get a draft based only on the details you’ve added. Review and
              edit everything before using it.
            </p>
            <label className="grid gap-1.5 text-[10px] font-semibold text-[#596a60]">
              <span>Target role (optional)</span>
              <input className="h-9 rounded-lg border border-[#e2e9e4] px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                maxLength={120}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="e.g. Senior product designer"
                value={targetRole}
              />
            </label>
            <button
              className="mt-3 flex min-h-[34px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#eaf3ee] text-[9px] font-bold text-[#1f5946] hover:bg-[#dcebe0] disabled:cursor-wait disabled:opacity-65"
              disabled={generating}
              onClick={() => void generateWithAi()}
              type="button"
            >
              {generating ? (
                <LoaderCircle className="animate-spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              {generating ? "Drafting…" : "Draft with AI"}
            </button>
          </section>
          <section className="rounded-xl border border-[#e8eeea] bg-white p-4">
            <p className="mb-3 text-[9px] font-bold tracking-[1px] text-[#92a097]">PRESENTATION</p>
            <h2 className="m-0 text-[13px] font-semibold text-[#172b26]">Choose a template</h2>
            <p className="mb-4 mt-1.5 text-[10px] text-[#8a9891]">Switch the look without changing your resume content.</p>
            <button
              className={`mb-2 grid w-full grid-cols-[41px_1fr_13px] items-center gap-2 rounded-lg border p-2 text-left ${template === "MODERN" ? "border-[#83a38e] bg-[#f7faf7]" : "border-[#e6ece7] bg-white"}`}
              onClick={() => setTemplate("MODERN")}
              type="button"
            >
              <span className="grid h-11 content-center gap-1 rounded border border-[#e8ece8] bg-white p-1.5"><i className="h-[3px] w-3/4 rounded bg-[#649076]" /><i className="h-[3px] rounded bg-[#dfe9e2]" /><i className="h-[3px] rounded bg-[#dfe9e2]" /></span>
              <span><strong className="block text-[9px] text-[#43564d]">Modern Professional</strong><small className="mt-1 block text-[8px] text-[#8a9891]">Clean, confident, contemporary</small></span>
              <span className={`size-3 rounded-full border ${template === "MODERN" ? "border-4 border-[#1f5946]" : "border-[#ccd7d0]"}`} />
            </button>
            <button
              className={`grid w-full grid-cols-[41px_1fr_13px] items-center gap-2 rounded-lg border p-2 text-left ${template === "ATS_CLASSIC" ? "border-[#83a38e] bg-[#f7faf7]" : "border-[#e6ece7] bg-white"}`}
              onClick={() => setTemplate("ATS_CLASSIC")}
              type="button"
            >
              <span className="grid h-11 content-center gap-1 rounded border border-[#e8ece8] bg-white p-1.5"><i className="h-[3px] rounded bg-[#858585]" /><i className="h-[3px] rounded bg-[#dfe9e2]" /><i className="h-[3px] rounded bg-[#dfe9e2]" /></span>
              <span><strong className="block text-[9px] text-[#43564d]">ATS Classic</strong><small className="mt-1 block text-[8px] text-[#8a9891]">Simple, traditional, scannable</small></span>
              <span className={`size-3 rounded-full border ${template === "ATS_CLASSIC" ? "border-4 border-[#1f5946]" : "border-[#ccd7d0]"}`} />
            </button>
          </section>
          <section className="grid grid-cols-[20px_1fr] gap-x-2 gap-y-1 rounded-xl border border-[#e7eee8] bg-[#f3f7f3] p-4 text-[#1f5946]">
            <Sparkles size={17} />
            <strong className="self-center text-[10px] text-[#41594a]">A little polish goes a long way</strong>
            <p className="col-start-2 m-0 text-[9px] leading-relaxed text-[#7d8c82]">
              Use simple headings, consistent dates, and clear descriptions of
              your impact. Keep decorative elements minimal.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function ResumeEntrySection({
  description,
  fields,
  onChange,
  sectionNumber,
  title,
  value,
}: {
  description: string;
  fields: Array<{
    key: keyof ResumeEntry;
    label: string;
    multiline?: boolean;
  }>;
  onChange: (value: ResumeEntry[]) => void;
  sectionNumber: string;
  title: string;
  value: ResumeEntry[];
}) {
  function updateEntry(index: number, key: keyof ResumeEntry, text: string) {
    onChange(
      value.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        if (key === "technologies") {
          return {
            ...entry,
            technologies: text
              .split(",")
              .map((technology) => technology.trim())
              .filter(Boolean),
          };
        }
        return { ...entry, [key]: text };
      }),
    );
  }

  return (
    <section className="rounded-xl border border-[#e8eeea] bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#edf5f0] text-[10px] font-bold text-[#1f5946]">{sectionNumber}</span>
        <div>
          <h2 className="m-0 text-[13px] font-semibold text-[#172b26]">{title}</h2>
          <p className="mb-0 mt-1 text-[10px] text-[#8a9891]">{description}</p>
        </div>
      </div>
      {value.map((entry, index) => (
        <div className="mb-3 ml-0 rounded-lg border border-[#edf1ee] bg-[#fcfdfc] p-3 sm:ml-[38px]" key={`${sectionNumber}-${index}`}>
          <div className="mb-3 flex items-center justify-between text-[9px] font-semibold text-[#66786e]">
            <span>{title} {index + 1}</span>
            <button className="grid size-6 place-items-center rounded-md text-[#9c6b63] hover:bg-[#fbefed]"
              aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
              onClick={() => onChange(value.filter((_, entryIndex) => entryIndex !== index))}
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label
                className={`grid gap-1.5 text-[10px] font-semibold text-[#596a60] ${field.multiline ? "sm:col-span-2" : ""}`}
                key={field.key}
              >
                <span>{field.label}</span>
                {field.multiline ? (
                  <textarea className="w-full resize-y rounded-lg border border-[#e2e9e4] px-3 py-2 text-xs font-normal leading-relaxed outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                    onChange={(event) => updateEntry(index, field.key, event.target.value)}
                    rows={3}
                    value={String(entry[field.key] || "")}
                  />
                ) : (
                  <input className="h-9 rounded-lg border border-[#e2e9e4] px-3 text-xs font-normal outline-none focus:border-[#81a18d] focus:ring-4 focus:ring-emerald-900/10"
                    onChange={(event) => updateEntry(index, field.key, event.target.value)}
                    value={
                      field.key === "technologies"
                        ? (entry.technologies || []).join(", ")
                        : String(entry[field.key] || "")
                    }
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        className="ml-0 inline-flex items-center gap-1.5 rounded-md px-1 py-2 text-[10px] font-semibold text-[#1f5946] hover:underline sm:ml-[38px]"
        onClick={() => onChange([...value, {}])}
        type="button"
      >
        <Plus size={14} /> Add {title.toLowerCase()}
      </button>
    </section>
  );
}
