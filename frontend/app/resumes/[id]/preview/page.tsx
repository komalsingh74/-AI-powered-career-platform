import ResumePreview from "@/components/resumes/resume-preview";

export default async function ResumePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResumePreview resumeId={id} />;
}
