import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();

  if (!email || !senha) {
    return NextResponse.json({ error: "Email e senha obrigatórios." }, { status: 400 });
  }

  if (senha !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("admin_auth");
  return res;
}
