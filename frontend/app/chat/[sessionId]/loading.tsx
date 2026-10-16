import { LoaderCircle } from "lucide-react";

export default function ChatSessionLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fb] p-6">
      <div className="text-center">
        <LoaderCircle aria-hidden="true" className="mx-auto animate-spin text-emerald-700" size={26} />
        <p className="mb-0 mt-3 text-sm text-slate-500">Loading your conversation…</p>
      </div>
    </main>
  );
}
