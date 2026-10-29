
"use client";

import { ArrowLeft, ArrowUpRight, Heart } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import BagIcon from "@/components/BagIcon";
import ProductImage from "@/components/ProductImage";
import WishlistButton from "@/components/WishlistButton";
import {
    getWishlist,
    subscribeToWishlist,
} from "@/lib/wishlist";

import WishlistIcon from "@/components/WishlistIcon";

type Product = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  collection: string | null;
  gender: string;
  price: string | number;
  stock: number;
  sizes: string | null;
  image_url: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const EMPTY_WISHLIST: number[] = [];

function getServerWishlist() {
  return EMPTY_WISHLIST;
}

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to wishlist changes.
  const savedIds = useSyncExternalStore(
    subscribeToWishlist,
    getWishlistSnapshot,
    getServerWishlist
  );

  const savedProducts = products.filter((product) =>
    savedIds.includes(product.id)
  );

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load your saved pieces.");
        }

        const data: Product[] = await response.json();

        if (!controller.signal.aborted) {
          setProducts(data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      {/* NAVIGATION */}
      <header className="border-b border-white/15 px-6 py-6 md:px-12">
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-[0.25em]"
          >
            TRYONIX<span className="text-[#b9a6dc]">.</span>
          </Link>

<div className="flex items-center gap-6">
  <Link
    href="/shop"
    className="text-xs tracking-[0.15em] text-white/60 transition hover:text-white"
  >
    SHOP
  </Link>

  {/* WISHLIST ICON WITH LIVE COUNTER */}
  <WishlistIcon />

  {/* SHOPPING BAG ICON */}
  <BagIcon />
</div>

        </nav>
      </header>

      {/* PAGE INTRO */}
      <section className="mx-auto max-w-[1600px] px-6 pb-14 pt-20 md:px-12 md:pt-28">
        <Link
          href="/shop"
          className="mb-12 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={15} />
          BACK TO COLLECTION
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-5 text-xs tracking-[0.35em] text-[#b9a6dc]">
            TRYONIX / YOUR EDIT
          </p>

          <h1 className="text-[clamp(3.5rem,10vw,10rem)] font-black leading-[0.9] tracking-[-0.07em]">
            YOUR
            <br />
            <span className="font-serif font-normal italic">
              FAVORITES.
            </span>
          </h1>

          <p className="mt-8 max-w-lg text-sm leading-8 text-white/55 md:text-base">
            Your personal collection of pieces worth keeping.
            Save what inspires you.
          </p>
        </motion.div>
      </section>

      {/* SAVED PRODUCTS */}
      <section className="mx-auto max-w-[1600px] px-6 pb-32 md:px-12">
        <div className="mb-12 flex items-center justify-between border-b border-white/15 pb-5">
          <p className="text-xs tracking-[0.2em] text-white/60">
            {loading
              ? "LOADING FAVORITES"
              : `${savedProducts.length} SAVED PIECES`}
          </p>

          <Heart size={19} className="text-[#b9a6dc]" />
        </div>

        {loading && (
          <p className="py-20 text-center text-sm tracking-widest text-white/50">
            LOADING YOUR FAVORITES...
          </p>
        )}

        {!loading && error && (
          <p role="alert" className="py-20 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && savedProducts.length === 0 && (
          <div className="py-24 text-center">
            <Heart
              size={38}
              strokeWidth={1.2}
              className="mx-auto mb-7 text-[#b9a6dc]"
            />

            <h2 className="text-2xl font-medium tracking-wide">
              YOUR WISHLIST IS EMPTY.
            </h2>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/45">
              Discover the collection and tap the heart on any
              piece you love to save it here.
            </p>

            <Link
              href="/shop"
              className="mt-10 inline-flex items-center gap-3 border border-[#b9a6dc] px-8 py-4 text-xs tracking-[0.15em] text-[#b9a6dc] transition hover:bg-[#b9a6dc] hover:text-black"
            >
              EXPLORE COLLECTION
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}

        {!loading && !error && savedProducts.length > 0 && (
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {savedProducts.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(index * 0.1, 0.3),
                }}
                className="group"
              >
                <div className="relative">
                  <Link
                    href={`/shop/${product.id}`}
                    aria-label={`View ${product.name}`}
                    className="relative block aspect-[3/4] overflow-hidden bg-[#242424]"
                  >
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                    />

                    <span className="absolute left-4 top-4 bg-black/75 px-3 py-2 text-[10px] tracking-[0.15em]">
                      {product.category.toUpperCase()}
                    </span>

                    <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-white text-black transition group-hover:bg-[#b9a6dc]">
                      <ArrowUpRight size={19} />
                    </span>
                  </Link>

                  <div className="absolute right-4 top-4 z-10">
                    <WishlistButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-2 text-[10px] tracking-[0.2em] text-[#b9a6dc]">
                      {product.collection || "TRYONIX ORIGINAL"}
                    </p>

                    <Link
                      href={`/shop/${product.id}`}
                      className="transition hover:text-[#b9a6dc]"
                    >
                      <h2 className="text-lg font-medium">
                        {product.name}
                      </h2>
                    </Link>

                    <p className="mt-2 text-xs text-white/45">
                      {product.gender} / {product.sizes || "ONE SIZE"}
                    </p>
                  </div>

                  <p className="shrink-0 text-base font-medium">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </p>
                </div>

                {product.stock === 0 && (
                  <p className="mt-3 text-xs tracking-widest text-red-300">
                    OUT OF STOCK
                  </p>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/15 px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 text-xs tracking-[0.15em] text-white/45 md:flex-row">
          <span>© {new Date().getFullYear()} TRYONIX</span>
          <span>DON&apos;T JUST WEAR IT. EXPERIENCE IT.</span>
        </div>
      </footer>
    </main>
  );
}

// Stable array snapshot for useSyncExternalStore.
let cachedWishlistJSON: string | null = null;
let cachedWishlist: number[] = EMPTY_WISHLIST;

function getWishlistSnapshot(): number[] {
  if (typeof window === "undefined") {
    return EMPTY_WISHLIST;
  }

  const raw = window.localStorage.getItem("tryonix_wishlist");

  if (raw !== cachedWishlistJSON) {
    cachedWishlistJSON = raw;
    cachedWishlist = getWishlist();
  }

  return cachedWishlist;
}
