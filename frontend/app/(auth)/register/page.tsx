"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { LoaderCircle, UserRoundPlus } from "lucide-react";

import AuthLayout from "@/components/auth/auth-layout";
import { registerApi } from "@/features/auth/auth.api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Choose a password with at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      await registerApi({ name: name.trim(), email: email.trim(), password });
      toast.success("Your account is ready. Sign in to get started.");
      router.replace("/login");
    } catch {
      toast.error("We couldn’t create your account. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      description="Create your free account and make space for your next step."
      title="Start your journey"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-[11px] font-semibold text-[#43564d]" htmlFor="name">Your name</label>
          <input
            autoComplete="name"
            className="h-12 w-full rounded-xl border border-[#dfe8e1] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#a4afa9] focus:border-[#54836d] focus:ring-4 focus:ring-emerald-900/10"
            id="name"
            maxLength={80}
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jordan Lee"
            required
            value={name}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold text-[#43564d]" htmlFor="email">Email address</label>
          <input
            autoComplete="email"
            className="h-12 w-full rounded-xl border border-[#dfe8e1] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#a4afa9] focus:border-[#54836d] focus:ring-4 focus:ring-emerald-900/10"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold text-[#43564d]" htmlFor="password">Password</label>
          <input
            autoComplete="new-password"
            className="h-12 w-full rounded-xl border border-[#dfe8e1] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#a4afa9] focus:border-[#54836d] focus:ring-4 focus:ring-emerald-900/10"
            id="password"
            maxLength={72}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
            type="password"
            value={password}
          />
        </div>
        <button className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#185b46] text-sm font-semibold text-white shadow-[0_5px_12px_rgb(24_91_70_/_16%)] transition hover:bg-[#124936] disabled:cursor-wait disabled:opacity-70" disabled={loading} type="submit">
          {loading ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <UserRoundPlus size={16} />
          )}
          {loading ? "Creating your account…" : "Create my account"}
        </button>
      </form>
      <p className="mt-5 text-center text-[11px] text-[#7c8982]">
        Already have an account? <Link className="font-bold text-[#1f5946] no-underline hover:underline" href="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
