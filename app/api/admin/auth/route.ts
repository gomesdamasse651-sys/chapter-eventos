import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Rota legada mantida apenas para setar o cookie admin_auth.
// O signInWithPassword agora é feito no frontend (browser client).
// Espera receber o JWT do usuário já autenticado.
export async function POST(req: NextRequest) {
  const { token } = await req.json() as { token: string };

  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("id, primeiro_acesso")
    .eq("user_id", user.id)
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
