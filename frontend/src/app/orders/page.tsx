
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowRight,
  CheckCircle2,
  Package,
  ShoppingBag,
} from "lucide-react";

import { getAccessToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type OrderItem = {
  product_id: number;
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Order = {
  id: number;
  status: string;
  total_amount: number;
  payment_method: string;
  customer_name: string;
  created_at: string;
  items: OrderItem[];
};

// ==========================================
// ORDER HISTORY COMPONENT
// ==========================================

function OrdersContent() {
  const searchParams = useSearchParams();
  const placedOrderId = searchParams.get("placed");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH USER ORDERS
  // ==========================================

  useEffect(() => {
    async function fetchOrders() {
      const token = getAccessToken();

      if (!token) {
        setError("Please log in to view your orders.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          throw new Error("Unable to load your orders.");
        }

        const data: Order[] = await response.json();
        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading orders."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">

      {/* NAVIGATION */}

      <header className="border-b border-white/15 px-6 py-6 md:px-12">
        <nav className="mx-auto flex max-w-[1500px] items-center justify-between">

          <Link
            href="/"
            className="text-2xl font-semibold tracking-[0.25em]"
          >
            TRYONIX
            <span className="text-[#b9a6dc]">.</span>
          </Link>

          <Link
            href="/shop"
            className="flex items-center gap-2 text-xs tracking-[0.15em] text-white/60 transition hover:text-white"
          >
            CONTINUE SHOPPING
            <ArrowRight size={16} />
          </Link>

        </nav>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 pb-28 pt-16 md:px-12">

        <p className="mb-5 text-xs tracking-[0.3em] text-[#b9a6dc]">
          TRYONIX / YOUR ACCOUNT
        </p>

        <h1 className="text-[clamp(3.5rem,8vw,7rem)] font-black leading-none tracking-[-0.07em]">
          MY ORDERS
          <span className="text-[#b9a6dc]">.</span>
        </h1>

        {/* SUCCESS MESSAGE */}

        {placedOrderId && !loading && !error &&
          orders.some((order) => String(order.id) === placedOrderId) && (
          <div className="mt-12 flex items-start gap-4 border border-[#b9a6dc]/40 bg-[#b9a6dc]/5 p-6">

            <CheckCircle2
              size={26}
              className="shrink-0 text-[#b9a6dc]"
            />

            <div>
              <h2 className="text-lg font-semibold text-[#b9a6dc]">
                Demo Order Placed Successfully!
              </h2>

              <p className="mt-2 text-sm leading-7 text-white/60">
                Your order #{placedOrderId} has been recorded.
                No actual payment or delivery will take place.
              </p>
            </div>

          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="mt-16 text-sm tracking-widest text-white/50">
            LOADING YOUR ORDERS...
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="mt-14 border border-red-400/30 p-7">
            <p className="text-sm text-red-300">{error}</p>

            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-2 text-xs tracking-widest text-white underline"
            >
              GO TO LOGIN
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* EMPTY ORDER HISTORY */}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-16 flex flex-col items-center border border-white/15 px-6 py-20 text-center">

            <ShoppingBag
              size={52}
              strokeWidth={1}
              className="mb-8 text-[#b9a6dc]"
            />

            <h2 className="text-3xl font-semibold">
              No orders yet.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-white/50">
              Your TRYONIX shopping journey starts here.
              Explore our collection and place your first demo order.
            </p>

            <Link
              href="/shop"
              className="mt-9 inline-flex items-center gap-4 bg-white px-7 py-5 text-xs font-semibold tracking-widest text-black transition hover:bg-[#b9a6dc]"
            >
              START SHOPPING
              <ArrowRight size={18} />
            </Link>

          </div>
        )}

        {/* ORDER HISTORY */}

        {!loading && !error && orders.length > 0 && (
          <div className="mt-14 space-y-7">

            {orders.map((order) => (
              <article
                key={order.id}
                className="border border-white/15 p-6 transition hover:border-white/30 md:p-9"
              >

                {/* ORDER HEADER */}

                <div className="flex flex-wrap items-start justify-between gap-6">

                  <div>
                    <p className="text-xs tracking-[0.2em] text-[#b9a6dc]">
                      ORDER #{order.id}
                    </p>

                    <p className="mt-3 text-sm text-white/50">
                      {new Date(order.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 border border-[#b9a6dc]/30 px-4 py-2 text-xs tracking-widest text-[#b9a6dc]">
                    <Package size={15} />
                    {order.status.toUpperCase()}
                  </div>

                </div>

                {/* PRODUCTS */}

                <div className="mt-8 space-y-5 border-t border-white/15 pt-7">

                  {order.items.map((item, index) => (
                    <div
                      key={`${item.product_id}-${item.size}-${index}`}
                      className="flex flex-wrap items-start justify-between gap-4"
                    >

                      <div>
                        <Link
                          href={`/shop/${item.product_id}`}
                          className="text-base font-medium transition hover:text-[#b9a6dc]"
                        >
                          {item.product_name}
                        </Link>

                        <p className="mt-2 text-xs tracking-wide text-white/50">
                          SIZE: {item.size} | QUANTITY: {item.quantity}
                        </p>
                      </div>

                      <p className="text-base font-medium">
                        {formatPrice(item.subtotal)}
                      </p>

                    </div>
                  ))}

                </div>

                {/* ORDER TOTAL */}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-white/15 pt-7">

                  <div>
                    <p className="text-xs tracking-widest text-white/40">
                      PAYMENT METHOD
                    </p>

                    <p className="mt-2 text-sm text-white/70">
                      Demo Cash on Delivery
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs tracking-widest text-white/40">
                      ORDER TOTAL
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>

                </div>

              </article>
            ))}

          </div>
        )}

      </div>

      {/* FOOTER */}

      <footer className="border-t border-white/15 px-6 py-10 text-center text-xs tracking-[0.2em] text-white/40">
        TRYONIX — DON&apos;T JUST WEAR IT. EXPERIENCE IT.
      </footer>

    </main>
  );
}

// ==========================================
// NEXT.JS SUSPENSE WRAPPER
// ==========================================

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0b] text-white" />
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
