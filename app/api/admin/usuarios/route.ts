import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

async function getSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("role")
    .eq("id", user.id)
    .single();

  return admin?.role === "superadmin" ? user : null;
}

export async function GET() {
  const user = await getSuperAdmin();
  if (!user) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { data } = await supabaseAdmin
    .from("admins")
    .select("id, email, nome, role, criado_em")
    .order("criado_em", { ascending: true });

  return NextResponse.json({ usuarios: data });
}

export async function POST(req: NextRequest) {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { email, nome, senha } = await req.json();

  // Cria usuário no Supabase Auth
  const { data: newUser, error: errAuth } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (errAuth || !newUser.user) {
    return NextResponse.json({ error: errAuth?.message ?? "Erro ao criar usuário." }, { status: 500 });
  }

  // Insere na tabela admins
  const { error: errInsert } = await supabaseAdmin.from("admins").insert({
    id: newUser.user.id,
    email,
    nome,
    role: "admin",
  });

  if (errInsert) {
    return NextResponse.json({ error: errInsert.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { id } = await req.json();

  await supabaseAdmin.from("admins").delete().eq("id", id);
  await supabaseAdmin.auth.admin.deleteUser(id);

  return NextResponse.json({ success: true });
}
