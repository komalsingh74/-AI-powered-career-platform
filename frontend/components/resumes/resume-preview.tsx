"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Printer } from "lucide-react";
import { toast } from "react-toastify";
import {
  getResumeApi,
  type Resume,
  type ResumeEntry,
} from "@/features/resumes/resumes.api";

function Entry({ item, classic }: { item: ResumeEntry; classic: boolean }) {
  const heading =
    item.title || item.degree || item.name || item.company || item.school || "";
  const subheading = [item.company, item.school, item.issuer, item.location]
    .filter((part) => part && part !== heading)
    .join(" · ");
  const dates = [item.startDate, item.endDate].filter(Boolean).join(" — ");

  return (
    <article className="mt-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={`m-0 text-[10px] ${classic ? "font-semibold text-[#222]" : "font-bold text-[#2d3f34]"}`}>{heading}</h3>
        {dates && <span className="text-[9px] text-[#64736a]">{dates}</span>}
      </div>
      {subheading && <p className="mb-0 mt-1 text-[9px] italic text-[#64736a]">{subheading}</p>}
      {item.description && <p className="mb-0 mt-1.5 whitespace-pre-wrap text-[10px] leading-relaxed text-[#36443b]">{item.description}</p>}
      {item.technologies?.length ? (
        <p className="mb-0 mt-1.5 text-[10px] leading-relaxed text-[#36443b]">{item.technologies.join(" · ")}</p>
      ) : null}
    </article>
  );
}

export default function ResumePreview({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getResumeApi(resumeId)
      .then((data) => {
        if (active) setResume(data);
      })
      .catch(() => {
        if (active) {
          toast.error("Unable to load this resume.");
          router.replace("/resumes");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resumeId, router]);

  if (loading || !resume) {
    return (
      <main className="flex min-h-[55vh] items-center justify-center gap-2.5 text-xs text-[#1f5946]">
        <LoaderCircle className="animate-spin" size={20} />
        <span>Preparing your preview…</span>
      </main>
    );
  }

  const { personalInformation: person } = resume.content;
  const contact = [person.email, person.phone, person.location, ...person.links]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <main className="min-h-screen bg-[#f3f5f3] pb-12 print:bg-white print:p-0">
      <header className="sticky top-0 z-10 flex min-h-[60px] items-center justify-between gap-3 border-b border-[#e8eeea] bg-white/95 px-4 backdrop-blur print:hidden sm:px-8">
        <Link className="inline-flex shrink-0 items-center gap-2 text-[11px] text-[#708078] no-underline hover:text-[#1f5946]" href="/resumes">
          <ArrowLeft size={15} /> All resumes
        </Link>
        <span className="overflow-hidden px-2 text-ellipsis whitespace-nowrap text-[10px] text-[#78877f]">Preview · {resume.title}</span>
        <div className="flex shrink-0 gap-2">
          <Link className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#dce6df] bg-white px-3 text-[11px] font-semibold text-[#52665c] no-underline hover:bg-[#f4f8f5]" href={`/resumes/${resumeId}/edit`}>
            Edit resume
          </Link>
          <button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#1f5946] px-3 text-[11px] font-semibold text-white hover:bg-[#164634]" onClick={() => window.print()} type="button">
            <Printer size={15} /> Print / save PDF
          </button>
        </div>
      </header>

      <article className={`mx-auto my-7 min-h-[1000px] w-[min(800px,calc(100%-36px))] border border-[#e3e8e4] bg-white px-7 py-10 text-[#27352d] shadow-[0_8px_35px_rgb(31_47_37_/_7%)] print:my-0 print:min-h-0 print:w-full print:border-0 print:px-0 print:py-0 print:shadow-none sm:px-16 sm:py-[62px] ${resume.template === "ATS_CLASSIC" ? "[font-family:Georgia,serif]" : "[font-family:Arial,Helvetica,sans-serif]"}`}>
        <header className={`border-b-2 pb-5 text-center ${resume.template === "ATS_CLASSIC" ? "border-[#333]" : "border-[#2d6148]"}`}>
          <h1 className={`m-0 text-2xl font-bold tracking-normal ${resume.template === "ATS_CLASSIC" ? "text-[#222]" : "text-[#214a36]"}`}>{person.name || "Your name"}</h1>
          {person.headline && <p className="mb-0 mt-2 text-xs text-[#5d6e63]">{person.headline}</p>}
          {contact && <p className="mb-0 mt-2.5 text-[9px] text-[#66736a]">{contact}</p>}
        </header>

        {resume.content.summary && (
          <section className="mt-5">
            <h2 className={`mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.8px] ${resume.template === "ATS_CLASSIC" ? "border-[#bbb] text-[#333]" : "border-[#dce6de] text-[#27563e]"}`}>Professional Summary</h2>
            <p className="m-0 whitespace-pre-wrap text-[10px] leading-relaxed text-[#36443b]">{resume.content.summary}</p>
          </section>
        )}
        {resume.content.experience.length > 0 && (
          <section className="mt-5">
            <h2 className={`mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.8px] ${resume.template === "ATS_CLASSIC" ? "border-[#bbb] text-[#333]" : "border-[#dce6de] text-[#27563e]"}`}>Experience</h2>
            {resume.content.experience.map((item, index) => (
              <Entry classic={resume.template === "ATS_CLASSIC"} item={item} key={`experience-${index}`} />
            ))}
          </section>
        )}
        {resume.content.education.length > 0 && (
          <section className="mt-5">
            <h2 className={`mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.8px] ${resume.template === "ATS_CLASSIC" ? "border-[#bbb] text-[#333]" : "border-[#dce6de] text-[#27563e]"}`}>Education</h2>
            {resume.content.education.map((item, index) => (
              <Entry classic={resume.template === "ATS_CLASSIC"} item={item} key={`education-${index}`} />
            ))}
          </section>
        )}
        {resume.content.skills.length > 0 && (
          <section className="mt-5">
            <h2 className={`mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.8px] ${resume.template === "ATS_CLASSIC" ? "border-[#bbb] text-[#333]" : "border-[#dce6de] text-[#27563e]"}`}>Skills</h2>
            <p className="m-0 whitespace-pre-wrap text-[10px] leading-relaxed text-[#36443b]">{resume.content.skills.join("  ·  ")}</p>
          </section>
        )}
        {resume.content.projects.length > 0 && (
          <section className="mt-5">
            <h2 className={`mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.8px] ${resume.template === "ATS_CLASSIC" ? "border-[#bbb] text-[#333]" : "border-[#dce6de] text-[#27563e]"}`}>Projects</h2>
            {resume.content.projects.map((item, index) => (
              <Entry classic={resume.template === "ATS_CLASSIC"} item={item} key={`project-${index}`} />
            ))}
          </section>
        )}
        {resume.content.certifications.length > 0 && (
          <section className="mt-5">
            <h2 className={`mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.8px] ${resume.template === "ATS_CLASSIC" ? "border-[#bbb] text-[#333]" : "border-[#dce6de] text-[#27563e]"}`}>Certifications</h2>
            {resume.content.certifications.map((item, index) => (
              <Entry classic={resume.template === "ATS_CLASSIC"} item={item} key={`certification-${index}`} />
            ))}
          </section>
        )}
        {resume.content.achievements.length > 0 && (
          <section className="mt-5">
            <h2 className={`mb-2 border-b pb-1 text-[11px] font-bold uppercase tracking-[0.8px] ${resume.template === "ATS_CLASSIC" ? "border-[#bbb] text-[#333]" : "border-[#dce6de] text-[#27563e]"}`}>Achievements</h2>
            <ul className="list-disc space-y-1 pl-5 text-[10px] leading-relaxed text-[#36443b]">
              {resume.content.achievements.map((item, index) => (
                <li key={`achievement-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
