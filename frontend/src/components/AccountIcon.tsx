
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";

import {
  getAccessToken,
  subscribeToAuth,
} from "@/lib/auth";

function getAuthSnapshot(): string | null {
  return getAccessToken();
}

function getServerSnapshot(): null {
  return null;
}

export default function AccountIcon() {
  const token = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerSnapshot
  );

  const authenticated = Boolean(token);

  return (
    <Link
      href={authenticated ? "/account" : "/login"}
      aria-label={authenticated ? "My account" : "Sign in"}
      title={authenticated ? "My Account" : "Sign In"}
      className="transition hover:text-[#b9a6dc]"
    >
      <UserRound size={19} />
    </Link>
  );
}
