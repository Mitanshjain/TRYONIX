
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

import {
  getWishlistCount,
  subscribeToWishlist,
} from "@/lib/wishlist";

// ==========================================
// WISHLIST ICON WITH LIVE COUNTER
// ==========================================

export default function WishlistIcon() {
  const count = useSyncExternalStore(
    subscribeToWishlist,
    getWishlistCount,
    () => 0
  );

  return (
    <Link
      href="/wishlist"
      aria-label={`Wishlist, ${count} saved products`}
      title="Your Wishlist"
      className="group relative inline-flex h-10 w-10 items-center justify-center text-white/70 transition hover:text-[#b9a6dc]"
    >
      <Heart
        size={21}
        strokeWidth={1.7}
        fill={count > 0 ? "currentColor" : "none"}
        className="transition-transform duration-300 group-hover:scale-110"
      />

      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b9a6dc] px-1 text-[10px] font-semibold text-black"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
