import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PATH = "/auth";
const PUBLIC_PATHS = new Set<string>([
  AUTH_PATH,
  "/reset-password",
  "/manifest.webmanifest",
  "/sw.js",
]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/reset-password")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/images")) return true;
  if (pathname.startsWith("/icons")) return true;
  if (pathname === "/") return false;
  return false;
}

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const pathname = nextUrl.pathname;

  if (isPublicPath(pathname)) {
    if (pathname === AUTH_PATH) {
      const token = cookies.get("token")?.value;
      if (token) {
        const url = nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  }

  const token = cookies.get("token")?.value;

  if (!token) {
    const url = nextUrl.clone();
    url.pathname = AUTH_PATH;
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
