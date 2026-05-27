import { NextRequest } from "next/server";

export function checkAdminAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get("admin_auth");
  return cookie?.value === "true";
}
