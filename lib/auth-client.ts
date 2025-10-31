const TOKEN_COOKIE_KEY = "token";

const isBrowser = typeof document !== "undefined";

export function setAuthToken(token: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (!isBrowser) return;

  document.cookie = [
    `${TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}`,
    "path=/",
    `max-age=${maxAgeSeconds}`,
    "samesite=lax",
  ].join("; ");
}

export function clearAuthToken() {
  if (!isBrowser) return;

  document.cookie = [
    `${TOKEN_COOKIE_KEY}=`,
    "path=/",
    "max-age=0",
    "samesite=lax",
  ].join("; ");
}

export function hasAuthToken(): boolean {
  if (!isBrowser) return false;

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${TOKEN_COOKIE_KEY}=`));
}

export function getAuthToken(): string | null {
  if (!isBrowser) return null;

  const entry = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${TOKEN_COOKIE_KEY}=`));

  if (!entry) return null;

  return decodeURIComponent(entry.split("=")[1] ?? "");
}
