import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { ingresso_id, chave_pix } = await req.json() as { ingresso_id: string; chave_pix: string };

  if (!ingresso_id || !chave_pix?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  // Verifica que o ingresso pertence ao usuário e é elegível
  const { data: ingresso, error: errBusca } = await supabaseAdmin
    .from("ingressos")
    .select("id, status, seguro_reembolso, reembolso_solicitado, email")
    .eq("id", ingresso_id)
    .single();

  if (errBusca || !ingresso) {
    return NextResponse.json({ error: "Ingresso não encontrado." }, { status: 404 });
  }

  if (ingresso.email !== user.email) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  if (!ingresso.seguro_reembolso) {
    return NextResponse.json({ error: "Este ingresso não possui seguro reembolsável." }, { status: 400 });
  }

  if (ingresso.status !== "pago") {
    return NextResponse.json({ error: "Apenas ingressos pagos podem solicitar reembolso." }, { status: 400 });
  }

  if (ingresso.reembolso_solicitado) {
    return NextResponse.json({ error: "Reembolso já solicitado." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("ingressos")
    .update({
      reembolso_solicitado: true,
      reembolso_chave_pix: chave_pix.trim(),
      reembolso_solicitado_em: new Date().toISOString(),
    })
    .eq("id", ingresso_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
