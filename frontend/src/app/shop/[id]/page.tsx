
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { addToCart } from "@/lib/cart";

import BagIcon from "@/components/BagIcon";
import WishlistIcon from "@/components/WishlistIcon";
import WishlistButton from "@/components/WishlistButton";

// ==========================================
// PRODUCT TYPE
// ==========================================

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

// ==========================================
// API CONFIGURATION
// ==========================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ==========================================
// PRODUCT DETAIL PAGE
// ==========================================

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToBag, setAddedToBag] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // ==========================================
  // FETCH PRODUCT FROM FASTAPI
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      setLoading(true);
      setError(null);
      setProduct(null);
      setSelectedSize(null);
      setAddedToBag(false);
      setQuantity(1);

      try {
        const response = await fetch(`${API_URL}/products/${id}`, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          throw new Error("Product not found.");
        }

        if (!response.ok) {
          throw new Error("Unable to load product details.");
        }

        const data: Product = await response.json();

        if (!controller.signal.aborted) {
          setProduct(data);
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

    fetchProduct();

    return () => controller.abort();
  }, [id]);

  // ==========================================
  // EXTRACT AVAILABLE SIZES
  // ==========================================

  const availableSizes =
    product?.sizes
      ?.split(",")
      .map((size) => size.trim())
      .filter(Boolean) || [];

  // ==========================================
  // ADD PRODUCT TO SHOPPING BAG
  // ==========================================

  function handleAddToBag() {
    if (!product || product.stock <= 0) return;

    if (availableSizes.length > 0 && !selectedSize) {
      alert("Please select your size first.");
      return;
    }

    const size = selectedSize || "One Size";

    try {
      addToCart({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.image_url,
        size,
        quantity,
        stock: product.stock, // NEW: Available inventory
      });

      setAddedToBag(true);
    } catch {
      setAddedToBag(false);
      alert("Unable to save your bag. Please try again.");
    }
  }

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">

      {/* ======================================
          NAVIGATION
      ====================================== */}

      <header className="border-b border-white/15 px-6 py-6 md:px-12">
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between">

          {/* BRAND LOGO */}
          <Link
            href="/"
            className="text-2xl font-semibold tracking-[0.25em]"
          >
            TRYONIX
            <span className="text-[#b9a6dc]">.</span>
          </Link>

          {/* NAVIGATION LINKS */}
          <div className="flex items-center gap-6">

            <Link
              href="/shop"
              className="text-xs tracking-[0.2em] text-white/70 transition hover:text-white"
            >
              SHOP
            </Link>

            {/* WISHLIST WITH LIVE COUNTER */}
            <WishlistIcon />

            {/* SHOPPING BAG */}
            <BagIcon />

          </div>
        </nav>
      </header>

      {/* ======================================
          BACK TO SHOP
      ====================================== */}

      <div className="mx-auto max-w-[1600px] px-6 pt-10 md:px-12">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          BACK TO COLLECTION
        </Link>
      </div>

      {/* ======================================
          LOADING STATE
      ====================================== */}

      {loading && (
        <div className="flex min-h-[65vh] items-center justify-center">
          <p className="animate-pulse text-sm tracking-[0.25em] text-white/50">
            LOADING PRODUCT...
          </p>
        </div>
      )}

      {/* ======================================
          ERROR STATE
      ====================================== */}

      {error && !loading && (
        <div className="flex min-h-[65vh] flex-col items-center justify-center gap-8 px-6">

          <p role="alert" className="text-lg text-white/70">
            {error}
          </p>

          <Link
            href="/shop"
            className="border border-white/40 px-7 py-4 text-xs tracking-widest transition hover:bg-white hover:text-black"
          >
            RETURN TO SHOP
          </Link>

        </div>
      )}

      {/* ======================================
          PRODUCT DETAILS
      ====================================== */}

      {!loading && !error && product && (
        <section className="mx-auto grid max-w-[1600px] gap-14 px-6 pb-32 pt-12 md:grid-cols-2 md:gap-20 md:px-12 md:pt-20">

          {/* ==================================
              PRODUCT IMAGE + WISHLIST
          ================================== */}

          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[3/4] overflow-hidden bg-[#242424]"
          >

            {/* PRODUCT IMAGE */}
            {product.image_url ? (
              <div
                role="img"
                aria-label={product.name}
                className="h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url("${product.image_url}")`,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs tracking-widest text-white/40">
                IMAGE COMING SOON
              </div>
            )}

            {/* COLLECTION BADGE */}
            <div className="absolute left-5 top-5 bg-black/75 px-4 py-3 text-[10px] tracking-[0.2em]">
              {product.collection || "TRYONIX ORIGINAL"}
            </div>

            {/* WISHLIST HEART BUTTON */}
            <div className="absolute right-5 top-5 z-20">
              <WishlistButton
                productId={product.id}
                productName={product.name}
              />
            </div>

          </motion.div>

          {/* ==================================
              PRODUCT INFORMATION
          ================================== */}

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex flex-col justify-center"
          >

            {/* CATEGORY */}
            <p className="mb-6 text-xs tracking-[0.3em] text-[#b9a6dc]">
              {product.category.toUpperCase()} /{" "}
              {product.gender.toUpperCase()}
            </p>

            {/* PRODUCT NAME */}
            <h1 className="max-w-2xl text-[clamp(3rem,5vw,6rem)] font-black leading-[0.95] tracking-[-0.06em]">
              {product.name}
            </h1>

            {/* PRODUCT PRICE */}
            <p className="mt-8 text-3xl font-light">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </p>

            <div className="my-10 h-px bg-white/15" />

            {/* PRODUCT DESCRIPTION */}
            <p className="max-w-lg text-base leading-8 text-white/60">
              {product.description || "A curated piece from TRYONIX."}
            </p>

            {/* ==================================
                SIZE SELECTION
            ================================== */}

            <div className="mt-12">

              <p className="mb-5 text-xs tracking-[0.25em]">
                SELECT SIZE
              </p>

              <div className="flex flex-wrap gap-3">

                {availableSizes.length > 0 ? (
                  availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setAddedToBag(false);
                      }}
                      aria-pressed={selectedSize === size}
                      className={`flex h-14 min-w-14 items-center justify-center border px-4 text-sm transition ${
                        selectedSize === size
                          ? "border-white bg-white text-black"
                          : "border-white/25 hover:border-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-white/50">
                    One size / Size information unavailable
                  </p>
                )}

              </div>
            </div>

            {/* ==================================
                STOCK AVAILABILITY
            ================================== */}

            <div className="mt-8 flex items-center gap-3 text-sm">

              {product.stock > 0 ? (
                <>
                  <Check
                    size={17}
                    className="text-[#b9a6dc]"
                  />

                  <span className="text-white/65">
                    In stock — {product.stock} available
                  </span>
                </>
              ) : (
                <span className="text-red-300">
                  Out of stock
                </span>
              )}

            </div>



{/* ==================================
    QUANTITY SELECTOR
================================== */}

<div className="mt-10">
  <p className="mb-5 text-xs tracking-[0.25em]">
    QUANTITY
  </p>

  <div className="inline-flex items-center border border-white/25">
    <button
      type="button"
      onClick={() => {
        setQuantity((previous) => Math.max(1, previous - 1));
        setAddedToBag(false);
      }}
      disabled={quantity <= 1 || product.stock <= 0}
      aria-label="Decrease quantity"
      className="flex h-14 w-14 items-center justify-center text-xl transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      −
    </button>

    <span className="flex h-14 w-14 items-center justify-center border-x border-white/25 text-sm">
      {quantity}
    </span>

    <button
      type="button"
      onClick={() => {
        setQuantity((previous) =>
          Math.min(product.stock, previous + 1)
        );
        setAddedToBag(false);
      }}
      disabled={quantity >= product.stock}
      aria-label="Increase quantity"
      className="flex h-14 w-14 items-center justify-center text-xl transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      +
    </button>
  </div>

  <p className="mt-3 text-xs text-white/40">
    Maximum available: {product.stock}
  </p>
</div>


            {/* ==================================
                SHOPPING ACTIONS
            ================================== */}

            <div className="mt-10 flex flex-col gap-4">

              {/* ADD TO BAG BUTTON */}
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={product.stock <= 0}
                className="flex items-center justify-between bg-white px-7 py-6 text-xs font-semibold tracking-[0.2em] text-black transition hover:bg-[#b9a6dc] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {product.stock <= 0
                  ? "OUT OF STOCK"
                  : "ADD TO BAG"}

                <ShoppingBag size={20} />
              </button>

              {/* ==================================
                  SUCCESS MESSAGE
              ================================== */}

              {addedToBag && (
                <div className="flex flex-wrap items-center justify-between gap-4 border border-[#b9a6dc]/30 bg-[#b9a6dc]/5 px-5 py-4">

                  <p
                    role="status"
                    className="flex items-center gap-2 text-sm text-[#b9a6dc]"
                  >
                    <Check size={17} />
                    Added to your bag successfully!
                  </p>

                  <Link
                    href="/bag"
                    className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-white transition hover:text-[#b9a6dc]"
                  >
                    VIEW BAG
                    <ArrowUpRight size={17} />
                  </Link>

                </div>
              )}

              {/* ==================================
                  AI VIRTUAL TRY-ON
              ================================== */}

              <div className="flex items-center justify-between border border-[#b9a6dc]/40 px-7 py-6 text-xs tracking-[0.2em] text-[#b9a6dc]">

                <span className="flex items-center gap-3">
                  <Sparkles size={19} />
                  AI VIRTUAL TRY-ON — COMING SOON
                </span>

                <ArrowUpRight size={19} />

              </div>

            </div>

            {/* ADDITIONAL INFORMATION */}
            <p className="mt-7 text-xs leading-6 text-white/40">
              Select your preferred size and add this piece
              to your bag. Your bag is saved in this browser.
              AI virtual try-on is currently in development.
            </p>

          </motion.div>
        </section>
      )}

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="border-t border-white/15 px-6 py-10 text-center text-xs tracking-[0.2em] text-white/40">
        TRYONIX — DON&apos;T JUST WEAR IT. EXPERIENCE IT.
      </footer>

    </main>
  );
}
