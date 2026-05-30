import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("ingressos")
    .select("id, nome, email, categoria, preco, reembolso_chave_pix, reembolso_solicitado_em, reembolso_pago, reembolso_pago_em, status, lotes(numero)")
    .eq("reembolso_solicitado", true)
    .order("reembolso_solicitado_em", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reembolsos: data });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { ingresso_id } = await req.json() as { ingresso_id: string };
  if (!ingresso_id) return NextResponse.json({ error: "ingresso_id obrigatório." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("ingressos")
    .update({
      reembolso_pago: true,
      reembolso_pago_em: new Date().toISOString(),
      status: "cancelado",
    })
    .eq("id", ingresso_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
