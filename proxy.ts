import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  if (!req.nextUrl.pathname.startsWith("/admin")) return res;
  if (req.nextUrl.pathname === "/admin/login") return res;

  const auth = req.cookies.get("admin_auth");
  if (!auth || auth.value !== "true") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
