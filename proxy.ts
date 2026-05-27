import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // Admin — cookie simples
  if (path.startsWith("/admin")) {
    if (path === "/admin/login") return res;
    const auth = req.cookies.get("admin_auth");
    if (!auth || auth.value !== "true") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return res;
  }

  // Dashboard — Supabase Auth
  if (path.startsWith("/dashboard")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL(`/login?redirect=${path}`, req.url));
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
