import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { email, nova_senha } = await req.json() as { email: string; nova_senha: string };

  if (!email || !nova_senha) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  if (nova_senha.length < 8) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  // Busca user_id pelo email
  const { data: adminRecord } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!adminRecord?.user_id) {
    return NextResponse.json({ error: "Admin não encontrado." }, { status: 404 });
  }

  // Atualiza senha no Auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    adminRecord.user_id,
    { password: nova_senha }
  );

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Marca primeiro_acesso = false
  const { error: dbError } = await supabaseAdmin
    .from("admin_users")
    .update({ primeiro_acesso: false })
    .eq("email", email.toLowerCase().trim());

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
