
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
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
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Please check your information and try again.";

        throw new Error(message);
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed."
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
          </Link>

          <div className="relative z-10 max-w-lg">
            <p className="mb-6 text-xs uppercase tracking-[0.4em] text-[#c4b9dd]">
              The future of personal style
            </p>

            <h1 className="text-6xl leading-[1.1] font-light tracking-tight xl:text-7xl">
              Your style.
              <br />
              <span className="font-serif italic text-[#c4b9dd]">
                Reimagined.
              </span>
            </h1>

            <p className="mt-8 max-w-sm text-base leading-8 text-white/60">
              Discover extraordinary fashion and experience a new
              way to try before you buy.
            </p>
          </div>

          <p className="relative z-10 text-xs tracking-[0.2em] text-white/40">
            DON'T JUST WEAR IT. EXPERIENCE IT.
          </p>
        </section>

        {/* RIGHT - REGISTRATION FORM */}
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
              Join the experience
            </p>

            <h2 className="text-4xl font-light tracking-tight sm:text-5xl">
              Create your account<span className="text-[#827394]">.</span>
            </h2>

            <p className="mt-4 text-sm leading-7 text-neutral-500">
              A more personal way to discover and experience fashion
              starts here.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-xs font-medium uppercase tracking-widest"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full border-b border-neutral-300 bg-transparent px-0 py-4 text-sm outline-none transition focus:border-[#827394]"
                />
              </div>

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
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full border-b border-neutral-300 bg-transparent px-0 py-4 pr-12 text-sm outline-none transition focus:border-[#827394]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 bg-[#191919] px-6 py-4 text-sm font-medium tracking-widest text-white transition hover:bg-[#514760] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    CREATING ACCOUNT
                  </>
                ) : (
                  <>
                    CREATE ACCOUNT
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#171717] underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-neutral-400">
            © {new Date().getFullYear()} TRYONIX. A new era of fashion.
          </p>
        </section>
      </div>
    </main>
  );
}
