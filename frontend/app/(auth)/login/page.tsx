"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { LoaderCircle, LogIn } from "lucide-react";

import AuthLayout from "@/components/auth/auth-layout";
import { loginApi } from "@/features/auth/auth.api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }

    try {
      setLoading(true);
      await loginApi({ email: email.trim(), password });
      toast.success("Welcome back");
      router.replace("/dashboard");
    } catch {
      toast.error("We couldn’t sign you in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      description="Sign in to pick up where you left off."
      title="Welcome back"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
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
            autoComplete="current-password"
            className="h-12 w-full rounded-xl border border-[#dfe8e1] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#a4afa9] focus:border-[#54836d] focus:ring-4 focus:ring-emerald-900/10"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            type="password"
            value={password}
          />
        </div>
        <button className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#185b46] text-sm font-semibold text-white shadow-[0_5px_12px_rgb(24_91_70_/_16%)] transition hover:bg-[#124936] disabled:cursor-wait disabled:opacity-70" disabled={loading} type="submit">
          {loading ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <LogIn size={16} />
          )}
          {loading ? "Signing in…" : "Sign in to your workspace"}
        </button>
      </form>
      <p className="mt-5 text-center text-[11px] text-[#7c8982]">
        New to Help Study Abroad? <Link className="font-bold text-[#1f5946] no-underline hover:underline" href="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
