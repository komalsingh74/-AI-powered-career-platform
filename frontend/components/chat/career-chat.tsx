"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  Check,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Plane,
  Send,
  Sparkles,
  Trash2,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import BrandLogo from "@/components/brand-logo";
import {
  createChatSessionApi,
  deleteChatSessionApi,
  getChatMessagesApi,
  listChatSessionsApi,
  renameChatSessionApi,
  sendChatMessageApi,
  type ChatMessage,
  type ChatSession,
} from "@/features/chat/chat.api";

function requestErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response
    ) {
      const data = response.data;
      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message;
      }
    }
  }
  return "We couldn’t complete that request. Please try again.";
}

export default function CareerChat({
  initialSessionId,
}: {
  initialSessionId?: string;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState(initialSessionId || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endOfMessages = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const result = await getChatMessagesApi(sessionId);
      setMessages(result.messages);
    } catch (requestError) {
      const status =
        typeof requestError === "object" &&
        requestError !== null &&
        "response" in requestError &&
        typeof requestError.response === "object" &&
        requestError.response !== null &&
        "status" in requestError.response
          ? requestError.response.status
          : undefined;
      if (status === 401) {
        router.replace("/login");
        return;
      }
      setMessages([]);
      setError(requestErrorMessage(requestError));
    }
  }, [router]);

  const loadSessions = useCallback(async () => {
    try {
      const result = await listChatSessionsApi();
      setSessions(result);
      const selected =
        result.find((session) => session._id === initialSessionId)?._id ||
        result[0]?._id ||
        "";
      setActiveSessionId(selected);
      if (selected) {
        await loadMessages(selected);
        if (selected !== initialSessionId) router.replace(`/chat/${selected}`);
      } else {
        setMessages([]);
      }
    } catch (requestError) {
      const status =
        typeof requestError === "object" &&
        requestError !== null &&
        "response" in requestError &&
        typeof requestError.response === "object" &&
        requestError.response !== null &&
        "status" in requestError.response
          ? requestError.response.status
          : undefined;
      if (status === 401) router.replace("/login");
      else setError(requestErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [initialSessionId, loadMessages, router]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadSessions();
    });
    return () => {
      active = false;
    };
  }, [loadSessions]);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleNewChat() {
    try {
      const session = await createChatSessionApi();
      setSessions((current) => [session, ...current]);
      setActiveSessionId(session._id);
      setMessages([]);
      setError("");
      router.push(`/chat/${session._id}`);
    } catch (requestError) {
      toast.error(requestErrorMessage(requestError));
    }
  }

  async function selectSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setMessages([]);
    setError("");
    router.push(`/chat/${sessionId}`);
    await loadMessages(sessionId);
  }

  async function handleRename(session: ChatSession) {
    const nextTitle = window.prompt("Give this conversation a new name", session.title);
    if (nextTitle === null || !nextTitle.trim()) return;
    try {
      const updated = await renameChatSessionApi(session._id, nextTitle.trim());
      setSessions((current) =>
        current.map((item) => (item._id === session._id ? updated : item)),
      );
    } catch (requestError) {
      toast.error(requestErrorMessage(requestError));
    }
  }

  async function handleDelete(session: ChatSession) {
    if (!window.confirm(`Delete “${session.title}”? This cannot be undone.`)) return;
    try {
      await deleteChatSessionApi(session._id);
      const remaining = sessions.filter((item) => item._id !== session._id);
      setSessions(remaining);
      if (activeSessionId === session._id) {
        const nextSession = remaining[0];
        setActiveSessionId(nextSession?._id || "");
        setMessages([]);
        if (nextSession) {
          router.replace(`/chat/${nextSession._id}`);
          await loadMessages(nextSession._id);
        } else {
          router.replace("/chat");
        }
      }
    } catch (requestError) {
      toast.error(requestErrorMessage(requestError));
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);
    setError("");
    let sessionId = activeSessionId;
    try {
      if (!sessionId) {
        const session = await createChatSessionApi();
        sessionId = session._id;
        setActiveSessionId(sessionId);
        setSessions((current) => [session, ...current]);
        router.push(`/chat/${sessionId}`);
      }

      const optimisticMessage: ChatMessage = {
        _id: `optimistic-${Date.now()}`,
        role: "USER",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, optimisticMessage]);
      const result = await sendChatMessageApi(sessionId, content);
      setMessages((current) => [
        ...current.filter((message) => message._id !== optimisticMessage._id),
        { ...optimisticMessage, createdAt: new Date().toISOString() },
        result.message,
      ]);
      setSessions((current) =>
        current.some((session) => session._id === result.session._id)
          ? current.map((session) =>
              session._id === result.session._id ? result.session : session,
            )
          : [result.session, ...current],
      );
    } catch (requestError) {
      setError(requestErrorMessage(requestError));
      if (sessionId) await loadMessages(sessionId);
    } finally {
      setSending(false);
    }
  }

  const activeSession = sessions.find((session) => session._id === activeSessionId);

  return (
    <main className="flex min-h-screen flex-col bg-white md:h-screen md:flex-row">
      <aside className="hidden w-[258px] shrink-0 flex-col border-r border-[#e8edf1] bg-white px-4 py-6 xl:flex">
        <Link aria-label="Help Study Abroad home" className="mb-8 flex items-center px-2 no-underline" href="/dashboard"><BrandLogo className="h-10 w-[190px]" /></Link>
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[1.2px] text-slate-400">Workspace</p>
        <nav aria-label="Workspace navigation" className="grid gap-1">
          {[
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "AI career coach", href: "/chat", icon: Sparkles },
            { label: "My resumes", href: "/resumes", icon: FileText },
            { label: "Consultations", href: "/consultations", icon: CalendarDays },
            { label: "Study abroad", href: "/study-abroad", icon: Plane },
            { label: "My profile", href: "/profile", icon: UserRound },
          ].map(({ label, href, icon: Icon }) => <Link aria-current={href === "/chat" ? "page" : undefined} className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[10px] font-medium no-underline ${href === "/chat" ? "bg-[#eaf5ee] text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-emerald-800"}`} href={href} key={href}><Icon size={14} />{label}</Link>)}
        </nav>
        <div className="mt-auto rounded-xl border border-[#e4eee9] bg-[#f4faf6] p-3"><p className="m-0 text-[10px] font-semibold text-[#17384a]">A space to think</p><p className="mb-0 mt-1 text-[9px] leading-relaxed text-slate-500">Bring a question. Leave with a next step.</p></div>
      </aside>
      <aside className="flex w-full shrink-0 flex-col border-b border-[#e8eeea] bg-[#fbfcfa] p-4 md:w-[265px] md:border-b-0 md:border-r md:p-5">
        <div className="mb-5 flex items-center justify-between">
          <Link aria-label="Back to Help Study Abroad dashboard" className="flex items-center text-sm font-bold text-[#172b26] no-underline" href="/dashboard">
            <BrandLogo className="h-9 w-[170px]" />
          </Link>
          <Link aria-label="Back to dashboard" className="grid size-8 place-items-center rounded-lg border border-[#e8eeea] bg-white text-[#708078] md:hidden" href="/dashboard">
            <ArrowLeft size={15} />
          </Link>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div><p className="mb-1 text-[9px] font-bold tracking-[1px] text-[#8b9991]">YOUR CAREER COMPANION</p><h1 className="m-0 text-xl font-semibold tracking-tight text-[#172b26]">AI Coach</h1></div>
          <Sparkles className="text-[#1f5946]" size={17} />
        </div>
        <button
          aria-label="Start a new conversation"
          className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#dce8e0] bg-[#f0f6f2] text-[11px] font-semibold text-[#1f5946] transition hover:bg-[#e5f0e8]"
          onClick={() => void handleNewChat()}
          type="button"
        >
          <Plus size={15} /> New conversation
        </button>
        <select
          aria-label="Open a previous conversation"
          className="mt-2 h-10 w-full rounded-lg border border-[#e5ebe6] bg-white px-3 text-xs text-[#52645a] outline-none md:hidden"
          onChange={(event) => {
            if (event.target.value) void selectSession(event.target.value);
          }}
          value={activeSessionId}
        >
          <option value="">Recent conversations</option>
          {sessions.map((session) => (
            <option key={session._id} value={session._id}>{session.title}</option>
          ))}
        </select>
        <div className="mb-2 mt-6 hidden px-2 text-[9px] font-bold tracking-[0.9px] text-[#9ba79f] md:block">RECENT CONVERSATIONS</div>
        <nav aria-label="Chat conversations" className="hidden flex-1 content-start gap-1 overflow-y-auto md:grid">
          {sessions.map((session) => (
            <div
              className={`relative flex min-h-9 items-center rounded-lg text-[#738078] hover:bg-[#edf3ef] hover:text-[#1f5946] ${activeSessionId === session._id ? "bg-[#edf3ef] text-[#1f5946]" : ""}`}
              key={session._id}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden border-0 bg-transparent px-2 py-2 text-left text-inherit"
                onClick={() => void selectSession(session._id)}
                type="button"
              >
                <MessageCircle size={14} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px]">{session.title}</span>
              </button>
              <details className="group relative mr-1">
                <summary className="grid size-6 cursor-pointer list-none place-items-center rounded-md opacity-0 hover:bg-white group-hover:opacity-100 [&::-webkit-details-marker]:hidden" aria-label={`Options for ${session.title}`}>
                  <MoreHorizontal size={15} />
                </summary>
                <div className="absolute right-0 top-7 z-10 grid w-28 gap-0.5 rounded-lg border border-[#e5ebe6] bg-white p-1 shadow-lg">
                  <button className="flex items-center gap-1.5 rounded px-2 py-1.5 text-left text-[9px] text-[#52645a] hover:bg-[#f2f6f3]" onClick={() => void handleRename(session)} type="button">
                    Rename
                  </button>
                  <button
                    className="flex items-center gap-1.5 rounded px-2 py-1.5 text-left text-[9px] text-[#b15e56] hover:bg-[#f2f6f3]"
                    onClick={() => void handleDelete(session)}
                    type="button"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </details>
            </div>
          ))}
          {!loading && sessions.length === 0 && (
            <p className="m-2 text-[9px] leading-relaxed text-[#94a098]">Your conversations will show up here.</p>
          )}
        </nav>
        <div className="mt-auto hidden border-t border-[#e8eeea] pt-3 md:block">
          <Link className="flex items-center gap-2 text-[10px] text-[#7b8981] no-underline hover:text-[#1f5946]" href="/dashboard"><ArrowLeft size={14} /> Back to workspace</Link>
        </div>
      </aside>

      <section aria-label="Career coach conversation" className="flex min-h-[65vh] min-w-0 flex-1 flex-col md:min-h-0">
        <header className="flex min-h-[58px] items-center justify-between gap-3 border-b border-[#edf1ee] px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 text-[9px] text-[#87948d]">
            <span className="size-2 shrink-0 rounded-full bg-[#73a57c] ring-[3px] ring-[#e8f2e9]" />
            <strong className="text-[10px] text-[#4b5d53]">Career Coach</strong>
            <span className="text-[#c4cdc7]">·</span>
            <span className="truncate">Here to help you think things through</span>
          </div>
          <Link href="/resumes" className="flex shrink-0 items-center gap-1.5 text-[9px] text-[#6d7e74] no-underline hover:text-[#1f5946]">
            <FileText size={15} /> My resumes
          </Link>
        </header>

        {loading ? (
          <div className="grid flex-1 place-items-center text-[#1f5946]"><LoaderCircle className="animate-spin" size={20} /></div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 justify-center overflow-y-auto px-5 py-7">
              {messages.length === 0 ? (
                <div className="my-auto w-full max-w-[590px] py-4 text-center">
                  <span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-[#edf5f0] text-[#1f5946]"><Sparkles size={20} /></span>
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-[1px] text-[#75877e]">A thoughtful space to think out loud</p>
                  <h2 className="m-0 text-[clamp(21px,3vw,27px)] font-semibold tracking-tight text-[#172b26]">{activeSession ? activeSession.title : "What’s on your mind?"}</h2>
                  <p className="mx-auto mb-6 mt-2 max-w-[435px] text-[11px] leading-relaxed text-[#7a8981]">
                    Talk through a career decision, prepare for an interview, or
                    get a fresh perspective on what comes next.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "Help me prepare for an interview",
                      "How can I make my resume stronger?",
                      "I’m thinking about a career change",
                    ].map((suggestion) => (
                      <button className="flex items-center gap-2 rounded-lg border border-[#e5ebe6] bg-white px-3 py-2.5 text-[9px] text-[#5e7066] hover:border-[#afc7b7] hover:bg-[#f8fbf8] hover:text-[#1f5946]" key={suggestion} onClick={() => setInput(suggestion)} type="button">
                        {suggestion} <ArrowDown size={13} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid w-full max-w-[720px] content-start gap-6 py-2">
                  {messages.map((message) => (
                    <article className="flex items-start gap-3" key={message._id}>
                      <span className={`grid size-[29px] shrink-0 place-items-center rounded-lg text-[10px] font-bold ${message.role === "ASSISTANT" ? "bg-[#eaf2ed] text-[#1f5946]" : "rounded-full bg-[#f0ece4] text-[#8c704a]"}`}>
                        {message.role === "ASSISTANT" ? <Sparkles size={14} /> : "Y"}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="mb-1.5 text-[10px] font-bold text-[#516359]">
                          {message.role === "ASSISTANT" ? "Career Coach" : "You"}
                        </p>
                        <p className="m-0 whitespace-pre-wrap break-words text-[11px] leading-7 text-[#394a40]">{message.content}</p>
                      </div>
                    </article>
                  ))}
                  {sending && (
                    <div className="flex items-center gap-2 text-[9px] text-[#839188]">
                      <span className="grid size-[29px] place-items-center rounded-lg bg-[#eaf2ed] text-[#1f5946]"><Sparkles size={14} /></span>
                      <span className="flex gap-1"><i className="size-1.5 animate-bounce rounded-full bg-[#76a185]" /><i className="size-1.5 animate-bounce rounded-full bg-[#76a185] [animation-delay:150ms]" /><i className="size-1.5 animate-bounce rounded-full bg-[#76a185] [animation-delay:300ms]" /></span>
                      <span>Thinking it through…</span>
                    </div>
                  )}
                  <div ref={endOfMessages} />
                </div>
              )}
            </div>
            {error && <p className="mx-auto mb-2 w-[min(720px,calc(100%-40px))] rounded-lg border border-[#f0dfd7] bg-[#fff8f5] px-3 py-2 text-[10px] text-[#a65f4f]" role="alert">{error}</p>}
            <div className="mx-auto w-[min(760px,calc(100%-40px))] py-3 pb-4">
              <form className="flex items-end gap-2.5 rounded-xl border border-[#dfe8e2] bg-white p-3 shadow-sm focus-within:border-[#a7c0af] focus-within:ring-4 focus-within:ring-emerald-900/5" onSubmit={(event) => void handleSend(event)}>
                <textarea
                  aria-label="Message your career coach"
                  className="max-h-36 min-h-[42px] w-full resize-y border-0 bg-transparent text-[11px] leading-relaxed text-[#172b26] outline-none placeholder:text-[#9aa69f]"
                  maxLength={4000}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Tell me what you’re thinking about…"
                  rows={2}
                  value={input}
                />
                <button
                  aria-label="Send message"
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1f5946] text-white hover:bg-[#164634] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!input.trim() || sending}
                  type="submit"
                >
                  {sending ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={15} />}
                </button>
              </form>
              <p className="mt-2 flex justify-center gap-1 text-[9px] text-[#91a097]">
                <Check size={12} /> Helpful ideas, not a substitute for your own judgment.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
