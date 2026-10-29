
"use client";

// ==========================================
// TRYONIX - WISHLIST MANAGEMENT
// ==========================================

const WISHLIST_KEY = "tryonix_wishlist";
const WISHLIST_EVENT = "tryonix-wishlist-updated";

// ==========================================
// GET SAVED PRODUCT IDS
// ==========================================

export function getWishlist(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(WISHLIST_KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (id): id is number =>
        typeof id === "number" &&
        Number.isSafeInteger(id) &&
        id > 0
    );
  } catch {
    return [];
  }
}

// ==========================================
// SAVE WISHLIST
// ==========================================

function saveWishlist(ids: number[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify([...new Set(ids)])
  );

  window.dispatchEvent(new Event(WISHLIST_EVENT));
}

// ==========================================
// CHECK IF PRODUCT IS SAVED
// ==========================================

export function isWishlisted(productId: number): boolean {
  return getWishlist().includes(productId);
}

// ==========================================
// TOGGLE WISHLIST PRODUCT
// ==========================================

export function toggleWishlist(productId: number): boolean {
  const wishlist = getWishlist();

  if (wishlist.includes(productId)) {
    saveWishlist(wishlist.filter((id) => id !== productId));
    return false;
  }

  saveWishlist([...wishlist, productId]);
  return true;
}

// ==========================================
// GET WISHLIST COUNT
// ==========================================

export function getWishlistCount(): number {
  return getWishlist().length;
}

// ==========================================
// SUBSCRIBE TO WISHLIST CHANGES
// ==========================================

export function subscribeToWishlist(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(WISHLIST_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(WISHLIST_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
