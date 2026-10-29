
"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

import { saveAccessToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const registered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Invalid email or password."
        );
      }

      if (!data.access_token) {
        throw new Error("Login response did not include an access token.");
      }

      // Temporary client-side token storage for development.
      // Production authentication will use secure HttpOnly cookies.
      saveAccessToken(data.access_token);

      router.push("/shop");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#171717]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT - BRAND EXPERIENCE */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#161616] p-12 text-white lg:flex">

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,#4a4267_0%,#24212c_40%,#111111_80%)]" />

          <Link
            href="/"
            className="relative z-10 text-2xl font-semibold tracking-[0.24em]"
          >
            TRYONIX
            <span className="text-[#b9a6dc]">.</span>
          </Link>

          <div className="relative z-10 max-w-lg">

            <p className="mb-6 text-xs uppercase tracking-[0.4em] text-[#c4b9dd]">
              Welcome to TRYONIX
            </p>

            <h1 className="text-6xl font-light leading-[1.1] tracking-tight xl:text-7xl">
              Welcome
              <br />
              <span className="font-serif italic text-[#c4b9dd]">
                Back.
              </span>
            </h1>

            <p className="mt-8 max-w-sm text-base leading-8 text-white/60">
              Your personal fashion experience continues here.
              Sign in to explore the world of TRYONIX.
            </p>

          </div>

          <p className="relative z-10 text-xs tracking-[0.2em] text-white/40">
            DON&apos;T JUST WEAR IT. EXPERIENCE IT.
          </p>

        </section>

        {/* RIGHT - LOGIN FORM */}
        <section className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-20">

          <div className="flex items-center justify-between">

            <Link
              href="/"
              className="text-xl font-semibold tracking-[0.2em] lg:hidden"
            >
              TRYONIX
            </Link>

            <Link
              href="/"
              className="ml-auto text-sm text-neutral-500 transition hover:text-black"
            >
              Back to home ↗
            </Link>

          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">

            <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-[#827394]">
              Your fashion experience
            </p>

            <h2 className="text-4xl font-light tracking-tight sm:text-5xl">
              Sign in
              <span className="text-[#827394]">.</span>
            </h2>

            <p className="mt-4 text-sm leading-7 text-neutral-500">
              Enter your credentials to access your account.
            </p>

            {/* REGISTRATION SUCCESS */}
            {registered && (
              <div
                role="status"
                className="mt-7 border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800"
              >
                Account created successfully! Please sign in.
              </div>
            )}

            {/* LOGIN FORM */}
            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-6"
            >

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium uppercase tracking-widest"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border-b border-neutral-300 bg-transparent px-0 py-4 text-sm outline-none transition focus:border-[#827394]"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-medium uppercase tracking-widest"
                >
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border-b border-neutral-300 bg-transparent px-0 py-4 pr-12 text-sm outline-none transition focus:border-[#827394]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-0 top-4 text-neutral-500 hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 bg-[#191919] px-6 py-4 text-sm font-medium tracking-widest text-white transition hover:bg-[#514760] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    SIGNING IN
                  </>
                ) : (
                  <>
                    SIGN IN
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

            </form>

            {/* REGISTER LINK */}
            <p className="mt-8 text-center text-sm text-neutral-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#171717] underline underline-offset-4"
              >
                Create account
              </Link>
            </p>

          </div>

          <p className="text-center text-xs text-neutral-400">
            © {new Date().getFullYear()} TRYONIX.
            A new era of fashion.
          </p>

        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}