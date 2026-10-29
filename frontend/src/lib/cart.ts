
export type CartItem = {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  size: string;
  quantity: number;
  stock?: number;
};

const CART_KEY = "tryonix_cart";
const CART_EVENT = "tryonix-cart-updated";

// Get all cart items
export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

// Save cart and notify components
function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

// Add product to cart

export function addToCart(item: CartItem): void {
  const cart = getCart();

  const existingItem = cart.find(
    (product) =>
      product.productId === item.productId &&
      product.size === item.size
  );

  if (existingItem) {
    const stock = item.stock ?? existingItem.stock;

    existingItem.stock = stock;

    const requestedQuantity =
      existingItem.quantity + item.quantity;

    existingItem.quantity =
      stock !== undefined
        ? Math.min(requestedQuantity, Math.max(0, stock))
        : requestedQuantity;
  } else {
    const quantity =
      item.stock !== undefined
        ? Math.min(item.quantity, Math.max(0, item.stock))
        : item.quantity;

    if (quantity < 1) return;

    cart.push({
      ...item,
      quantity,
    });
  }

  saveCart(cart);
}


// Remove product from cart
export function removeFromCart(
  productId: number,
  size: string
): void {
  const updatedCart = getCart().filter(
    (item) =>
      !(item.productId === productId && item.size === size)
  );

  saveCart(updatedCart);
}

// Update quantity

export function updateQuantity(
  productId: number,
  size: string,
  quantity: number
): void {
  if (!Number.isInteger(quantity)) return;

  if (quantity <= 0) {
    removeFromCart(productId, size);
    return;
  }

  const updatedCart = getCart().map((item) => {
    if (item.productId !== productId || item.size !== size) {
      return item;
    }

    const safeQuantity =
      item.stock !== undefined
        ? Math.min(quantity, Math.max(1, item.stock))
        : quantity;

    return {
      ...item,
      quantity: safeQuantity,
    };
  });

  saveCart(updatedCart);
}


// Calculate total price
export function getCartTotal(): number {
  return getCart().reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

// Calculate total items
export function getCartCount(): number {
  return getCart().reduce(
    (count, item) => count + item.quantity,
    0
  );
}

// Clear entire cart
export function clearCart(): void {
  saveCart([]);
}

// Subscribe to cart changes
export function subscribeToCart(
  callback: () => void
): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
