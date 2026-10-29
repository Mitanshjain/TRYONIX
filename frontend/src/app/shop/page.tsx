
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowLeft, Search, X } from "lucide-react";

import BagIcon from "@/components/BagIcon";
import WishlistIcon from "@/components/WishlistIcon";
import ProductImage from "@/components/ProductImage";
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
// SHOP PAGE
// ==========================================

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // CATEGORY FILTERING
  // ==========================================

  const [selectedCategory, setSelectedCategory] =
    useState<string>("ALL");

  // ==========================================
  // PRODUCT SEARCH
  // ==========================================

  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // PRODUCT SORTING
  // ==========================================

  const [sortBy, setSortBy] = useState("default");

  const categories = [
    "ALL",
    ...new Set(products.map((product) => product.category)),
  ];

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "ALL" ||
      product.category === selectedCategory;

    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      (product.collection ?? "").toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  // ==========================================
  // SORT PRODUCTS
  // ==========================================

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return Number(a.price) - Number(b.price);

      case "price-high":
        return Number(b.price) - Number(a.price);

      case "newest":
        return b.id - a.id;

      default:
        return 0;
    }
  });

  // ==========================================
  // FETCH PRODUCTS FROM FASTAPI
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load products.");
        }

        const data: Product[] = await response.json();
        setProducts(data);
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
          <div className="flex items-center gap-4 sm:gap-7 md:gap-9">

            <Link
              href="/"
              className="hidden text-xs tracking-[0.2em] text-white/70 transition hover:text-white sm:inline"
            >
              HOME
            </Link>

            <Link
              href="/register"
              className="text-xs tracking-[0.15em] text-white/70 transition hover:text-white"
            >
              JOIN TRYONIX
            </Link>

            {/* WISHLIST ICON WITH LIVE COUNTER */}
            <WishlistIcon />

            {/* DYNAMIC SHOPPING BAG ICON */}
            <BagIcon />

          </div>
        </nav>
      </header>

      {/* ======================================
          PAGE INTRO
      ====================================== */}

      <section className="mx-auto max-w-[1600px] px-6 pb-16 pt-20 md:px-12 md:pt-28">

        {/* BACK TO HOME */}
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={15} />
          BACK TO HOME
        </Link>

        {/* ANIMATED INTRO */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >

          <p className="mb-5 text-xs tracking-[0.35em] text-[#b9a6dc]">
            TRYONIX / THE EDIT
          </p>

          <h1 className="text-[clamp(4rem,11vw,11rem)] font-black leading-[0.9] tracking-[-0.07em]">
            THE
            <br />

            <span className="font-serif font-normal italic">
              COLLECTION.
            </span>
          </h1>

          <p className="mt-8 max-w-lg text-sm leading-8 text-white/55 md:text-base">
            Discover contemporary fashion, curated for individuality.
            Explore pieces designed for your next expression.
          </p>

        </motion.div>
      </section>

      {/* ======================================
          PRODUCT COLLECTION
      ====================================== */}

      <section className="mx-auto max-w-[1600px] px-6 pb-32 md:px-12">

        {/* COLLECTION HEADER */}
        <div className="mb-10 flex items-center justify-between border-b border-white/15 pb-5">

          <p className="text-xs tracking-[0.2em] text-white/60">
            {loading
              ? "LOADING COLLECTION"
              : error
                ? "COLLECTION UNAVAILABLE"
                : `${products.length} PIECES`}
          </p>

          <span className="text-xs tracking-[0.2em] text-[#b9a6dc]">
            CURATED FASHION
          </span>

        </div>

        {/* ======================================
            PRODUCT CATEGORY FILTERS
        ====================================== */}

        {!loading && !error && products.length > 0 && (
          <div className="mb-12 flex flex-wrap items-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
                className={`border px-5 py-3 text-[11px] tracking-[0.15em] transition-all duration-300 ${
                  selectedCategory === category
                    ? "border-[#b9a6dc] bg-[#b9a6dc] text-black"
                    : "border-white/20 text-white/60 hover:border-white/60 hover:text-white"
                }`}
              >
                {category === "ALL"
                  ? "ALL PIECES"
                  : category.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* ======================================
            PRODUCT SEARCH BAR
        ====================================== */}

        {!loading && !error && products.length > 0 && (
          <div className="mb-12">
            <div className="group relative max-w-xl">

              <Search
                size={19}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-[#b9a6dc]"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search the collection..."
                aria-label="Search products"
                className="w-full border border-white/20 bg-[#151515] py-5 pl-14 pr-14 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-[#b9a6dc]"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
                >
                  <X size={18} />
                </button>
              )}

            </div>

            {searchQuery.trim() && (
              <p className="mt-4 text-xs tracking-[0.12em] text-white/45">
                {filteredProducts.length} RESULTS FOUND
              </p>
            )}
          </div>
        )}

        {/* ======================================
            PRODUCT SORTING DROPDOWN
        ====================================== */}

        {!loading && !error && products.length > 0 && (
          <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-6">

            {/* PRODUCT COUNT */}
            <p className="text-xs tracking-[0.15em] text-white/50">
              SHOWING {sortedProducts.length} PIECES
            </p>

            {/* SORTING CONTROL */}
            <div className="flex items-center gap-4">
              <label
                htmlFor="product-sort"
                className="text-[11px] tracking-[0.15em] text-white/50"
              >
                SORT BY
              </label>

              <select
                id="product-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                className="cursor-pointer border border-white/20 bg-[#151515] px-4 py-3 text-xs tracking-wide text-white outline-none transition focus:border-[#b9a6dc]"
              >
                <option value="default">Featured</option>
                <option value="price-low">
                  Price: Low to High
                </option>
                <option value="price-high">
                  Price: High to Low
                </option>
                <option value="newest">
                  Newest Arrivals
                </option>
              </select>
            </div>

          </div>
        )}

        {/* ======================================
            LOADING STATE
        ====================================== */}

        {loading && (
          <div className="py-20 text-center">
            <p className="animate-pulse text-sm tracking-[0.2em] text-white/50">
              LOADING THE COLLECTION...
            </p>
          </div>
        )}

        {/* ======================================
            ERROR STATE
        ====================================== */}

        {!loading && error && (
          <div className="py-20 text-center">
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>

            <p className="mt-4 text-xs text-white/40">
              Please check your connection and try again.
            </p>
          </div>
        )}

        {/* ======================================
            EMPTY COLLECTION
        ====================================== */}

        {!loading && !error && products.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm tracking-[0.15em] text-white/50">
              NO PRODUCTS AVAILABLE YET.
            </p>

            <p className="mt-4 text-xs text-white/35">
              New pieces are coming soon.
            </p>
          </div>
        )}

        {/* ======================================
            NO MATCHING PRODUCTS
        ====================================== */}

        {!loading &&
          !error &&
          products.length > 0 &&
          filteredProducts.length === 0 && (
            <div className="py-20 text-center">

              <Search
                size={30}
                className="mx-auto mb-6 text-[#b9a6dc]"
              />

              <h3 className="text-2xl font-medium">
                NO MATCHING PIECES.
              </h3>

              <p className="mt-4 text-sm text-white/45">
                Try another search or select a different category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                }}
                className="mt-8 border border-[#b9a6dc] px-6 py-3 text-xs tracking-[0.15em] text-[#b9a6dc] transition hover:bg-[#b9a6dc] hover:text-black"
              >
                CLEAR ALL FILTERS
              </button>

            </div>
          )}

        {/* ======================================
            PRODUCT GRID
        ====================================== */}

        {!loading && !error && sortedProducts.length > 0 && (
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">

            {sortedProducts.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: Math.min(index * 0.1, 0.3),
                }}
                className="group"
              >

                {/* ==================================
                    PRODUCT IMAGE + WISHLIST
                ================================== */}

                <div className="relative">

                  {/* CLICKABLE PRODUCT IMAGE */}
                  <Link
                    href={`/shop/${product.id}`}
                    aria-label={`View ${product.name}`}
                    className="relative block aspect-[3/4] overflow-hidden bg-[#242424]"
                  >

                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                    />

                    {/* CATEGORY BADGE */}
                    <span className="absolute left-4 top-4 bg-black/75 px-3 py-2 text-[10px] tracking-[0.15em]">
                      {product.category.toUpperCase()}
                    </span>

                    {/* PRODUCT DETAILS ARROW */}
                    <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-white text-black transition group-hover:bg-[#b9a6dc]">
                      <ArrowUpRight size={19} />
                    </span>

                  </Link>

                  {/* WISHLIST HEART BUTTON */}
                  <div className="absolute right-4 top-4 z-10">
                    <WishlistButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>

                </div>

                {/* ==================================
                    PRODUCT INFORMATION
                ================================== */}

                <div className="mt-5 flex items-start justify-between gap-4">

                  {/* LEFT SIDE */}
                  <div className="min-w-0">

                    <p className="mb-2 text-[10px] tracking-[0.2em] text-[#b9a6dc]">
                      {product.collection || "TRYONIX ORIGINAL"}
                    </p>

                    {/* CLICKABLE PRODUCT NAME */}
                    <Link
                      href={`/shop/${product.id}`}
                      className="transition hover:text-[#b9a6dc]"
                    >
                      <h2 className="text-lg font-medium">
                        {product.name}
                      </h2>
                    </Link>

                    <p className="mt-2 text-xs text-white/45">
                      {product.gender} /{" "}
                      {product.sizes || "ONE SIZE"}
                    </p>

                  </div>

                  {/* PRICE */}
                  <p className="shrink-0 text-base font-medium">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </p>

                </div>

                {/* STOCK STATUS */}
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

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="border-t border-white/15 px-6 py-10 md:px-12">

        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 text-xs tracking-[0.15em] text-white/45 md:flex-row">

          <span>
            © {new Date().getFullYear()} TRYONIX
          </span>

          <span>
            DON&apos;T JUST WEAR IT. EXPERIENCE IT.
          </span>

        </div>

      </footer>

    </main>
  );
}
