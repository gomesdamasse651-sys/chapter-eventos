import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const qr = req.nextUrl.searchParams.get("qr");
  if (!qr) return NextResponse.json({ error: "QR code não informado." }, { status: 400 });

  const { data: rows, error } = await supabaseAdmin
    .from("ingressos")
    .select("id, nome, sexo, status, usado, lotes(numero)")
    .eq("qr_code", qr);

  const data = rows && rows.length > 0 ? rows[0] : null;
  if (!data) return NextResponse.json({ valido: false, erro: "Código inválido.", supabase_error: error?.message, rows_count: rows?.length ?? 0 });

  const lote = (data.lotes as unknown as { numero: number } | null)?.numero;

  if (data.usado || data.status === "usado") {
    return NextResponse.json({ valido: false, ja_usado: true, id: data.id, nome: data.nome, sexo: data.sexo, lote, erro: "Ingresso já utilizado." });
  }
  if (data.status === "pendente") {
    return NextResponse.json({ valido: false, usado: false, id: data.id, nome: data.nome, sexo: data.sexo, lote, erro: "Pagamento não confirmado." });
  }
  if (data.status === "pago") {
    return NextResponse.json({ valido: true, usado: false, id: data.id, nome: data.nome, sexo: data.sexo, lote, status: data.status });
  }
  return NextResponse.json({ valido: false, usado: false, id: data.id, nome: data.nome, sexo: data.sexo, lote, erro: `Status: ${data.status}` });
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { qr } = await req.json();
  if (!qr) return NextResponse.json({ error: "QR code não informado." }, { status: 400 });

  const { data: rows2, error: erroBusca } = await supabaseAdmin
    .from("ingressos")
    .select("id, status, usado")
    .eq("qr_code", qr);

  const ingresso = rows2 && rows2.length > 0 ? rows2[0] : null;
  if (!ingresso) return NextResponse.json({ error: "QR code não encontrado.", supabase_error: erroBusca?.message, rows_count: rows2?.length ?? 0 }, { status: 404 });
  if (ingresso.status !== "pago") return NextResponse.json({ error: "Ingresso não pago." }, { status: 400 });
  if (ingresso.usado) return NextResponse.json({ error: "Ingresso já utilizado." }, { status: 409 });

  await supabaseAdmin
    .from("ingressos")
    .update({ usado: true, usado_em: new Date().toISOString() })
    .eq("id", ingresso.id);

  return NextResponse.json({ success: true });
}
