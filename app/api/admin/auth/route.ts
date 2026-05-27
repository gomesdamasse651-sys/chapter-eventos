import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("nome, role")
    .eq("id", user.id)
    .single();

  if (!admin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  return NextResponse.json({ email: user.email, nome: admin.nome, role: admin.role });
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
