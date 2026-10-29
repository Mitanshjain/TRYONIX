
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  LockKeyhole,
  ShoppingBag,
} from "lucide-react";

import { clearCart, getCart, type CartItem } from "@/lib/cart";

import { getAccessToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type CheckoutForm = {
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
};

type OrderResponse = {
  id: number;
  total_amount: number;
  status: string;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<CheckoutForm>({
    customer_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
  });

  // ==========================================
  // LOAD SHOPPING BAG
  // ==========================================

  useEffect(() => {
    setItems(getCart());
    setLoaded(true);
  }, []);

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  function updateField(
    field: keyof CheckoutForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ==========================================
  // PLACE DEMO ORDER
  // ==========================================

  async function handleCheckout(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting || items.length === 0) return;

    // Must match the key used in your login page.
    const token = getAccessToken();

    if (!token) {
      setError(
        "Please log in to your TRYONIX account before placing an order."
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          items: items.map((item) => ({
            product_id: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
        }),
      });

      const result: OrderResponse & {
        detail?: string | unknown[];
      } = await response.json();

      if (!response.ok) {
        const message =
          typeof result.detail === "string"
            ? result.detail
            : "Unable to place order. Please check your details.";

        throw new Error(message);
      }

      // Only clear the bag after successful order creation.
      clearCart();

      router.push(`/orders?placed=${result.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-white/20 bg-[#151515] px-5 py-4 text-sm text-white outline-none transition focus:border-[#b9a6dc]";

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
            href="/bag"
            className="flex items-center gap-2 text-xs tracking-[0.15em] text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            BACK TO BAG
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-[1300px] px-6 pb-28 pt-16 md:px-12">

        <p className="mb-5 text-xs tracking-[0.3em] text-[#b9a6dc]">
          TRYONIX / ORDER CHECKOUT
        </p>

        <h1 className="text-[clamp(3.5rem,8vw,7rem)] font-black leading-none tracking-[-0.07em]">
          CHECKOUT
          <span className="text-[#b9a6dc]">.</span>
        </h1>

        {!loaded && (
          <p className="mt-16 text-sm text-white/50">
            Loading your shopping bag...
          </p>
        )}

        {loaded && items.length === 0 && (
          <div className="mt-16 border border-white/15 p-10 text-center">
            <ShoppingBag
              size={48}
              className="mx-auto mb-6 text-[#b9a6dc]"
            />

            <h2 className="text-3xl font-semibold">
              Your bag is empty.
            </h2>

            <p className="mt-4 text-sm text-white/50">
              Add products to your bag before checking out.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-3 bg-white px-7 py-4 text-xs font-semibold tracking-widest text-black hover:bg-[#b9a6dc]"
            >
              EXPLORE COLLECTION
              <ArrowRight size={17} />
            </Link>
          </div>
        )}

        {loaded && items.length > 0 && (
          <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_380px]">

            {/* DELIVERY INFORMATION */}

            <form onSubmit={handleCheckout} className="space-y-8">

              <div>
                <h2 className="text-2xl font-semibold">
                  Delivery Information
                </h2>

                <p className="mt-3 text-sm text-white/50">
                  Enter your details for this demonstration order.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label
                    htmlFor="customer_name"
                    className="mb-3 block text-xs tracking-widest text-white/60"
                  >
                    FULL NAME
                  </label>
                  <input
                    id="customer_name"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.customer_name}
                    onChange={(e) =>
                      updateField("customer_name", e.target.value)
                    }
                    placeholder="Enter your full name"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="phone"
                    className="mb-3 block text-xs tracking-widest text-white/60"
                  >
                    PHONE NUMBER
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    minLength={10}
                    maxLength={20}
                    value={form.phone}
                    onChange={(e) =>
                      updateField("phone", e.target.value)
                    }
                    placeholder="Enter your mobile number"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-3 block text-xs tracking-widest text-white/60"
                  >
                    DELIVERY ADDRESS
                  </label>
                  <textarea
                    id="address"
                    required
                    minLength={5}
                    maxLength={1000}
                    rows={4}
                    value={form.address}
                    onChange={(e) =>
                      updateField("address", e.target.value)
                    }
                    placeholder="House number, street, area, landmark"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-3 block text-xs tracking-widest text-white/60"
                  >
                    CITY
                  </label>
                  <input
                    id="city"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.city}
                    onChange={(e) =>
                      updateField("city", e.target.value)
                    }
                    placeholder="Jaipur"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-3 block text-xs tracking-widest text-white/60"
                  >
                    STATE
                  </label>
                  <input
                    id="state"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.state}
                    onChange={(e) =>
                      updateField("state", e.target.value)
                    }
                    placeholder="Rajasthan"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="postal_code"
                    className="mb-3 block text-xs tracking-widest text-white/60"
                  >
                    PIN CODE
                  </label>
                  <input
                    id="postal_code"
                    required
                    minLength={4}
                    maxLength={12}
                    value={form.postal_code}
                    onChange={(e) =>
                      updateField("postal_code", e.target.value)
                    }
                    placeholder="302001"
                    className={inputClass}
                  />
                </div>

              </div>

              {/* PAYMENT METHOD */}

              <div className="border border-[#b9a6dc]/30 bg-[#b9a6dc]/5 p-6">

                <div className="flex items-center gap-3">
                  <CreditCard size={21} className="text-[#b9a6dc]" />

                  <h3 className="font-semibold">
                    Demo Cash on Delivery
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-7 text-white/50">
                  This is a portfolio demonstration.
                  No real payment will be collected and no actual
                  product will be shipped.
                </p>
              </div>

              {/* ERROR MESSAGE */}

              {error && (
                <div
                  role="alert"
                  className="border border-red-400/30 bg-red-400/5 p-5 text-sm text-red-300"
                >
                  {error}

                  {error.toLowerCase().includes("log in") && (
                    <Link
                      href="/login"
                      className="ml-2 font-semibold underline"
                    >
                      LOG IN
                    </Link>
                  )}
                </div>
              )}

              {/* PLACE ORDER */}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-between bg-white px-7 py-6 text-xs font-bold tracking-[0.2em] text-black transition hover:bg-[#b9a6dc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "PLACING YOUR ORDER..."
                  : "PLACE DEMO ORDER"}

                <ArrowRight size={20} />
              </button>

              <p className="flex items-center gap-2 text-xs text-white/40">
                <LockKeyhole size={14} />
                Account authentication is required to place an order.
              </p>

            </form>

            {/* ORDER SUMMARY */}

            <aside className="h-fit border border-white/20 p-7 md:p-9">

              <p className="mb-8 text-xs tracking-[0.25em] text-[#b9a6dc]">
                ORDER SUMMARY
              </p>

              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex gap-4 border-b border-white/10 pb-6"
                  >
                    <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#242424]">
                      {item.imageUrl ? (
                        <div
                          role="img"
                          aria-label={item.name}
                          className="h-full w-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url("${item.imageUrl}")`,
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-white/40">
                          NO IMAGE
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <p className="text-sm font-medium">
                        {item.name}
                      </p>

                      <p className="text-xs text-white/50">
                        Size: {item.size} | Qty: {item.quantity}
                      </p>

                      <p className="text-sm font-semibold">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between text-sm text-white/60">
                <span>Items ({itemCount})</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm text-white/60">
                <span>Demo shipping</span>
                <span className="text-[#b9a6dc]">FREE</span>
              </div>

              <div className="my-7 h-px bg-white/15" />

              <div className="flex items-center justify-between">
                <span className="text-sm tracking-widest">
                  ESTIMATED TOTAL
                </span>

                <span className="text-2xl font-semibold">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <p className="mt-6 text-xs leading-6 text-white/40">
                Final prices and stock are verified by the backend
                when your order is submitted.
              </p>

            </aside>

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
