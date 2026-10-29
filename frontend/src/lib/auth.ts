
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const TOKEN_KEY = "tryonix_access_token";
const AUTH_EVENT = "tryonix-auth-changed";

export type UserProfile = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

// Get saved JWT token
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  return sessionStorage.getItem(TOKEN_KEY);
}

// Save token and notify components
export function saveAccessToken(token: string): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// Remove token and notify components
export function logout(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// Subscribe to authentication changes
export function subscribeToAuth(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Fetch authenticated user
export async function getCurrentUser(): Promise<UserProfile> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("User is not logged in.");
  }

  const response = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error("Session expired. Please sign in again.");
    }

    throw new Error("Unable to fetch user profile.");
  }

  return response.json() as Promise<UserProfile>;
}
