
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Package,
} from "lucide-react";

import BagIcon from "@/components/BagIcon";

import {
  getCart,
  getCartCount,
  getCartTotal,
  removeFromCart,
  updateQuantity,
  subscribeToCart,
  type CartItem,
} from "@/lib/cart";

// ==========================================
// TRYONIX - SHOPPING BAG PAGE
// ==========================================

export default function BagPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // ==========================================
  // LOAD CART AND LISTEN FOR UPDATES
  // ==========================================

  useEffect(() => {
    function refreshCart() {
      setItems(getCart());
      setSubtotal(getCartTotal());
      setItemCount(getCartCount());
    }

    refreshCart();
    setLoaded(true);

    return subscribeToCart(refreshCart);
  }, []);

  // ==========================================
  // UPDATE PRODUCT QUANTITY
  // ==========================================

  function changeQuantity(
    productId: number,
    size: string,
    quantity: number
  ) {
    if (quantity < 1) return;

    updateQuantity(productId, size, quantity);
  }

  // ==========================================
  // REMOVE PRODUCT FROM BAG
  // ==========================================

  function handleRemove(productId: number, size: string) {
    removeFromCart(productId, size);
  }

  // ==========================================
  // FORMAT PRICE
  // ==========================================

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">

      {/* ======================================
          NAVIGATION
      ====================================== */}

      <header className="border-b border-white/15 px-6 py-6 md:px-12">
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between">

          <Link
            href="/"
            className="text-2xl font-semibold tracking-[0.25em]"
          >
            TRYONIX
            <span className="text-[#b9a6dc]">.</span>
          </Link>

          <div className="flex items-center gap-4 sm:gap-7 md:gap-9">

            <Link
              href="/"
              className="hidden text-xs tracking-[0.2em] text-white/70 transition hover:text-white sm:inline"
            >
              HOME
            </Link>

            <Link
              href="/shop"
              className="text-xs tracking-[0.2em] text-white/70 transition hover:text-white"
            >
              SHOP
            </Link>

            <Link
              href="/orders"
              className="hidden items-center gap-2 text-xs tracking-[0.2em] text-white/70 transition hover:text-white sm:flex"
            >
              <Package size={16} />
              MY ORDERS
            </Link>

            <BagIcon />

          </div>
        </nav>
      </header>

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <section className="mx-auto max-w-[1600px] px-6 pb-12 pt-16 md:px-12 md:pt-24">

        <Link
          href="/shop"
          className="mb-12 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          CONTINUE SHOPPING
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-6">

          <div>
            <p className="mb-5 text-xs tracking-[0.3em] text-[#b9a6dc]">
              YOUR SELECTION / TRYONIX
            </p>

            <h1 className="text-[clamp(4rem,9vw,9rem)] font-black leading-[0.85] tracking-[-0.07em]">
              YOUR BAG
              <span className="text-[#b9a6dc]">.</span>
            </h1>
          </div>

          <p className="text-xs tracking-[0.2em] text-white/50">
            {loaded
              ? `${itemCount} ${itemCount === 1 ? "ITEM" : "ITEMS"}`
              : "LOADING..."}
          </p>

        </div>
      </section>

      {/* ======================================
          BAG CONTENT
      ====================================== */}

      <div className="mx-auto max-w-[1600px] px-6 pb-32 md:px-12">

        <div className="h-px bg-white/15" />

        {/* LOADING STATE */}

        {!loaded && (
          <div className="py-28 text-center text-sm tracking-widest text-white/50">
            LOADING YOUR BAG...
          </div>
        )}

        {/* ======================================
            EMPTY BAG STATE
        ====================================== */}

        {loaded && items.length === 0 && (
          <motion.section
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[55vh] flex-col items-center justify-center text-center"
          >

            <ShoppingBag
              size={54}
              strokeWidth={1}
              className="mb-8 text-[#b9a6dc]"
            />

            <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Nothing in your bag.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/50">
              Your next statement piece is waiting.
              Explore our collection and find your look.
            </p>

            <Link
              href="/shop"
              className="mt-10 inline-flex items-center gap-6 bg-white px-8 py-5 text-xs font-semibold tracking-[0.2em] text-black transition hover:bg-[#b9a6dc]"
            >
              EXPLORE COLLECTION
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/orders"
              className="mt-7 inline-flex items-center gap-2 text-xs tracking-widest text-white/50 transition hover:text-[#b9a6dc]"
            >
              <Package size={16} />
              VIEW MY ORDERS
            </Link>

          </motion.section>
        )}

        {/* ======================================
            CART WITH PRODUCTS
        ====================================== */}

        {loaded && items.length > 0 && (
          <div className="grid gap-16 pt-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20">

            {/* CART ITEMS */}

            <section className="space-y-8">

              {items.map((item, index) => (
                <motion.article
                  key={`${item.productId}-${item.size}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                  }}
                  className="grid grid-cols-[110px_minmax(0,1fr)] gap-5 border-b border-white/15 pb-8 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-8"
                >

                  {/* PRODUCT IMAGE */}

                  <Link
                    href={`/shop/${item.productId}`}
                    className="block aspect-[3/4] overflow-hidden bg-[#242424]"
                  >
                    {item.imageUrl ? (
                      <div
                        role="img"
                        aria-label={item.name}
                        className="h-full w-full bg-cover bg-center transition duration-500 hover:scale-105"
                        style={{
                          backgroundImage: `url("${item.imageUrl}")`,
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-[10px] text-white/40">
                        NO IMAGE
                      </div>
                    )}
                  </Link>

                  {/* PRODUCT DETAILS */}

                  <div className="flex min-w-0 flex-col justify-between">

                    <div>
                      <p className="mb-3 text-[10px] tracking-[0.2em] text-[#b9a6dc]">
                        TRYONIX ORIGINAL
                      </p>

                      <Link
                        href={`/shop/${item.productId}`}
                        className="text-lg font-semibold leading-snug tracking-tight transition hover:text-[#b9a6dc] sm:text-2xl"
                      >
                        {item.name}
                      </Link>

                      <p className="mt-3 text-xs tracking-[0.15em] text-white/50">
                        SIZE: {item.size}
                      </p>

                      <p className="mt-4 text-lg font-medium">
                        {formatPrice(item.price)}
                      </p>

                      <p className="mt-2 text-xs text-white/40">
                        Item total:{" "}
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* QUANTITY AND REMOVE */}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">

                      <div className="flex items-center border border-white/25">

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              item.productId,
                              item.size,
                              item.quantity - 1
                            )
                          }
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="flex h-10 w-10 items-center justify-center transition hover:bg-white/10 disabled:opacity-30"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="min-w-8 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              item.productId,
                              item.size,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            item.stock !== undefined &&
                            item.quantity >= item.stock
                          }
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex h-10 w-10 items-center justify-center transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus size={15} />
                        </button>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(item.productId, item.size)
                        }
                        className="inline-flex items-center gap-2 text-xs tracking-[0.12em] text-white/40 transition hover:text-red-300"
                      >
                        <Trash2 size={15} />
                        REMOVE
                      </button>

                    </div>

                    {item.stock !== undefined &&
                      item.quantity >= item.stock && (
                        <p className="mt-3 text-[11px] tracking-wide text-[#b9a6dc]">
                          MAXIMUM AVAILABLE STOCK REACHED
                        </p>
                      )}

                  </div>

                </motion.article>
              ))}

            </section>

            {/* ==================================
                ORDER SUMMARY
            ================================== */}

            <aside className="h-fit border border-white/20 p-7 md:p-9">

              <p className="mb-9 text-xs tracking-[0.25em] text-[#b9a6dc]">
                ORDER SUMMARY
              </p>

              {/* ITEM COUNT */}

              <div className="flex items-center justify-between text-sm text-white/60">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* SHIPPING */}

              <div className="mt-6 flex items-center justify-between gap-4 text-sm text-white/60">
                <span>Demo shipping</span>
                <span className="text-[#b9a6dc]">FREE</span>
              </div>

              <div className="my-8 h-px bg-white/15" />

              {/* TOTAL */}

              <div className="flex items-center justify-between">
                <span className="text-sm tracking-[0.15em]">
                  ESTIMATED TOTAL
                </span>

                <span className="text-2xl font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* CHECKOUT BUTTON */}

              <Link
                href="/checkout"
                className="mt-9 flex w-full items-center justify-between bg-white px-6 py-5 text-xs font-semibold tracking-[0.15em] text-black transition hover:bg-[#b9a6dc]"
              >
                PROCEED TO CHECKOUT
                <ArrowRight size={18} />
              </Link>

              {/* CHECKOUT INFORMATION */}

              <p className="mt-5 text-xs leading-6 text-white/40">
                Complete your order using our demo checkout.
                No real payment or shipment will occur.
                Final prices and stock are verified at checkout.
              </p>

              {/* MY ORDERS LINK */}

              <Link
                href="/orders"
                className="mt-7 inline-flex items-center gap-2 text-xs tracking-[0.15em] text-white/60 transition hover:text-[#b9a6dc]"
              >
                <Package size={16} />
                VIEW ORDER HISTORY
                <ArrowRight size={15} />
              </Link>

            </aside>

          </div>
        )}

      </div>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="border-t border-white/15 px-6 py-10 text-center text-xs tracking-[0.2em] text-white/40">
        TRYONIX — DON&apos;T JUST WEAR IT. EXPERIENCE IT.
      </footer>

    </main>
  );
}
