import { NextResponse } from "next/server";

export function middleware(request) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLoginPage = request.nextUrl.pathname === "/login";

  // For client-side authentication, we'll let the client handle the redirect
  // The middleware will just pass through
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
