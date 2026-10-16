import { Suspense } from "react";
import CareerChat from "@/components/chat/career-chat";

async function ChatSessionContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <CareerChat initialSessionId={sessionId} />;
}

export default function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading conversation…</p>
        </main>
      }
    >
      <ChatSessionContent params={params} />
    </Suspense>
  );
}
