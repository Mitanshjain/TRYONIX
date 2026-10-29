
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import {
  getCartCount,
  subscribeToCart,
} from "@/lib/cart";

export default function BagIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refreshCount = () => {
      setCount(getCartCount());
    };

    refreshCount();

    return subscribeToCart(refreshCount);
  }, []);

  return (
    <Link
      href="/bag"
      aria-label={`Shopping bag with ${count} items`}
      className="relative inline-flex items-center justify-center p-2 text-white transition hover:text-[#b9a6dc]"
    >
      <ShoppingBag size={21} strokeWidth={1.7} />

      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b9a6dc] px-1 text-[10px] font-semibold text-black">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
