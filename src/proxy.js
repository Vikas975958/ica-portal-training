import { NextResponse } from "next/server";

export function proxy(request) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/" || pathname.startsWith("/auth/");
  const isDashboardPage = pathname.startsWith("/dashboard");

  if (!token && isDashboardPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/:path*", "/dashboard/:path*"],
};
