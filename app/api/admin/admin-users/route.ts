import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/admin-auth";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://chapter-eventos.vercel.app";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .order("adicionado_em", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ admins: data });
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { nome, email } = await req.json() as { nome: string; email: string };
  if (!nome || !email) return NextResponse.json({ error: "Nome e email obrigatórios." }, { status: 400 });

  const senhaTemporaria = Math.random().toString(36).slice(-10);

  // Cria no Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password: senhaTemporaria,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Erro ao criar usuário." }, { status: 500 });
  }

  // Salva na tabela admin_users
  const { data: adminRecord, error: dbError } = await supabaseAdmin
    .from("admin_users")
    .insert({ nome, email: email.toLowerCase().trim(), user_id: authData.user.id })
    .select()
    .single();

  if (dbError) {
    // Rollback: deletar do Auth
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Envia email com credenciais
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Chapter <noreply@resend.dev>",
      to: email,
      subject: "Acesso ao painel admin — Chapter Two",
      html: `
        <p>Olá, ${nome}!</p>
        <p>Você foi adicionado como administrador do Chapter Two.</p>
        <p><strong>Email:</strong> ${email}<br/>
        <strong>Senha temporária:</strong> ${senhaTemporaria}</p>
        <p>Acesse: <a href="${APP_URL}/admin/login">${APP_URL}/admin/login</a></p>
        <p>Recomendamos alterar sua senha após o primeiro acesso.</p>
      `,
    });
  } catch {
    // Email falhou mas admin foi criado — não é erro crítico
  }

  return NextResponse.json({ admin: adminRecord, senha_temporaria: senhaTemporaria });
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await req.json() as { id: string };

  // Busca user_id antes de deletar
  const { data: adminRecord } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("id", id)
    .single();

  // Deleta da tabela
  const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deleta do Auth se user_id existir
  if (adminRecord?.user_id) {
    await supabaseAdmin.auth.admin.deleteUser(adminRecord.user_id);
  }

  return NextResponse.json({ success: true });
}
