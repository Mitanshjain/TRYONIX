
"use client";

import { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";

import {
  getWishlist,
  subscribeToWishlist,
  toggleWishlist,
} from "@/lib/wishlist";

// Stable snapshot for server rendering
const getServerSnapshot = () => false;

type WishlistButtonProps = {
  productId: number;
  productName: string;
};

export default function WishlistButton({
  productId,
  productName,
}: WishlistButtonProps) {
  const isSaved = useSyncExternalStore(
    subscribeToWishlist,
    () => getWishlist().includes(productId),
    getServerSnapshot
  );

  function handleClick() {
    toggleWishlist(productId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isSaved
          ? `Remove ${productName} from wishlist`
          : `Add ${productName} to wishlist`
      }
      aria-pressed={isSaved}
      title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:scale-110 ${
        isSaved
          ? "border-[#b9a6dc] bg-[#b9a6dc] text-black"
          : "border-white/20 bg-black/60 text-white hover:border-[#b9a6dc] hover:text-[#b9a6dc]"
      }`}
    >
      <Heart
        size={19}
        strokeWidth={1.8}
        fill={isSaved ? "currentColor" : "none"}
      />
    </button>
  );
}
