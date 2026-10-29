
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  LogOut,
  UserRound,
  Mail,
  ShieldCheck,
  LoaderCircle,
  ShoppingBag,
} from "lucide-react";

import {
  getAccessToken,
  getCurrentUser,
  logout,
} from "@/lib/auth";

type UserProfile = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!getAccessToken()) {
        router.replace("/login");
        return;
      }

      try {
        const profile = (await getCurrentUser()) as UserProfile;

        if (active) {
          setUser(profile);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load account."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">

      {/* NAVBAR */}
      <header className="border-b border-white/10">
        <nav className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-6 md:px-12">

          <Link
            href="/"
            className="text-2xl font-semibold tracking-[0.24em]"
          >
            TRYONIX
            <span className="text-[#b9a6dc]">.</span>
          </Link>

          <div className="flex items-center gap-7">
            <Link
              href="/shop"
              className="text-xs tracking-[0.2em] text-white/70 transition hover:text-white"
            >
              SHOP
            </Link>

            <Link
              href="/bag"
              aria-label="Shopping bag"
              className="transition hover:text-[#b9a6dc]"
            >
              <ShoppingBag size={20} />
            </Link>
          </div>
        </nav>
      </header>

      {/* ACCOUNT CONTENT */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 md:px-12 md:py-28">

        <p className="mb-5 text-xs tracking-[0.35em] text-[#b9a6dc]">
          TRYONIX / YOUR SPACE
        </p>

        <h1 className="text-6xl font-black tracking-[-0.06em] md:text-8xl">
          MY ACCOUNT<span className="text-[#b9a6dc]">.</span>
        </h1>

        <p className="mt-6 max-w-xl text-sm leading-8 text-white/50">
          Your personal space inside the TRYONIX experience.
        </p>

        {loading ? (
          <div
            role="status"
            className="mt-20 flex items-center gap-4 text-white/60"
          >
            <LoaderCircle
              size={24}
              className="animate-spin text-[#b9a6dc]"
            />
            LOADING YOUR ACCOUNT...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-16 border border-red-400/30 bg-red-400/5 p-8"
          >
            <p className="text-sm text-red-300">{error}</p>

            <Link
              href="/login"
              className="mt-5 inline-block text-sm underline underline-offset-4"
            >
              Sign in again
            </Link>
          </div>
        ) : user ? (
          <div className="mt-16 grid gap-8 lg:grid-cols-[1.5fr_1fr]">

            {/* PROFILE */}
            <div className="border border-white/15 bg-[#141414] p-8 md:p-12">

              <div className="mb-12 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#b9a6dc]/15 text-[#b9a6dc]">
                  <UserRound size={30} />
                </div>

                <span className="text-xs tracking-[0.2em] text-white/40">
                  MEMBER #{user.id}
                </span>
              </div>

              <p className="text-xs tracking-[0.25em] text-white/40">
                WELCOME BACK
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                {user.full_name}
              </h2>

              <div className="mt-12 space-y-8 border-t border-white/10 pt-8">

                <div className="flex items-start gap-4">
                  <Mail size={19} className="text-[#b9a6dc]" />

                  <div>
                    <p className="text-xs tracking-widest text-white/40">
                      EMAIL ADDRESS
                    </p>
                    <p className="mt-2 text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <ShieldCheck
                    size={19}
                    className="text-[#b9a6dc]"
                  />

                  <div>
                    <p className="text-xs tracking-widest text-white/40">
                      ACCOUNT STATUS
                    </p>

                    <p className="mt-2 text-sm">
                      {user.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs tracking-widest text-white/40">
                    MEMBER SINCE
                  </p>

                  <p className="mt-2 text-sm">
                    {new Date(user.created_at).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col gap-6">

              <Link
                href="/shop"
                className="group flex items-center justify-between border border-white/15 bg-[#141414] p-8 transition hover:border-[#b9a6dc]/60"
              >
                <div>
                  <p className="text-xs tracking-[0.2em] text-[#b9a6dc]">
                    DISCOVER
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold">
                    Explore Collection
                  </h3>
                </div>

                <ArrowUpRight
                  size={24}
                  className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/bag"
                className="group flex items-center justify-between border border-white/15 bg-[#141414] p-8 transition hover:border-[#b9a6dc]/60"
              >
                <div>
                  <p className="text-xs tracking-[0.2em] text-[#b9a6dc]">
                    YOUR SELECTION
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold">
                    Shopping Bag
                  </h3>
                </div>

                <ArrowUpRight
                  size={24}
                  className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-between border border-white/15 p-8 text-left transition hover:border-red-400/50 hover:text-red-300"
              >
                <div>
                  <p className="text-xs tracking-[0.2em] text-white/40">
                    ACCOUNT
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold">
                    Sign Out
                  </h3>
                </div>

                <LogOut size={24} />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-white/10 px-6 py-8 text-center text-xs tracking-[0.2em] text-white/40">
        © {new Date().getFullYear()} TRYONIX.
        DON&apos;T JUST WEAR IT. EXPERIENCE IT.
      </footer>
    </main>
  );
}
