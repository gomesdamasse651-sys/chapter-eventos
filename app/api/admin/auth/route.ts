import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json() as { email: string; senha: string };

  if (!email || !senha) {
    return NextResponse.json({ error: "Email e senha obrigatórios." }, { status: 400 });
  }

  // Autentica via Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password: senha,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  // Verifica se está na tabela admin_users
  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("id, primeiro_acesso")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  const primeiroacesso = (adminUser as { id: string; primeiro_acesso: boolean }).primeiro_acesso;

  const res = NextResponse.json({ success: true, trocar_senha: primeiroacesso });
  res.cookies.set("admin_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("admin_auth");
  return res;
}
