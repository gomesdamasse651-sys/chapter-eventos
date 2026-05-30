import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { incrementarVendido } from "@/lib/lotes";
import type { Categoria } from "@/lib/lotes";

const CATEGORIAS_VALIDAS: Categoria[] = [
  "masc_normal",
  "fem_normal",
  "masc_vip",
  "fem_vip",
];

export async function POST(req: NextRequest) {
  const secret = process.env.INFINITEPAY_WEBHOOK_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: {
    lote_id?: string;
    categoria?: string;
    ingresso_id?: string;
    status?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { lote_id, categoria, ingresso_id, status } = body;

  if (status !== "approved") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!lote_id || !categoria || !ingresso_id) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria as Categoria)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  await incrementarVendido(lote_id, categoria as Categoria);

  await supabaseAdmin
    .from("ingressos")
    .update({ status: "pago" })
    .eq("id", ingresso_id);

  return NextResponse.json({ ok: true });
}
