import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const qr = req.nextUrl.searchParams.get("qr");
  if (!qr) return NextResponse.json({ error: "QR code não informado." }, { status: 400 });

  const { data } = await supabaseAdmin
    .from("ingressos")
    .select("id, nome, sexo, status, usado, lotes(numero)")
    .eq("qr_code", qr)
    .single();

  if (!data) return NextResponse.json({ valido: false, erro: "QR code não encontrado." });

  return NextResponse.json({
    valido: data.status === "pago",
    usado: data.usado,
    id: data.id,
    nome: data.nome,
    sexo: data.sexo,
    status: data.status,
    lote: (data.lotes as unknown as { numero: number } | null)?.numero,
  });
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { qr } = await req.json();
  if (!qr) return NextResponse.json({ error: "QR code não informado." }, { status: 400 });

  const { data: ingresso } = await supabaseAdmin
    .from("ingressos")
    .select("id, status, usado")
    .eq("qr_code", qr)
    .single();

  if (!ingresso) return NextResponse.json({ error: "QR code não encontrado." }, { status: 404 });
  if (ingresso.status !== "pago") return NextResponse.json({ error: "Ingresso não pago." }, { status: 400 });
  if (ingresso.usado) return NextResponse.json({ error: "Ingresso já utilizado." }, { status: 409 });

  await supabaseAdmin
    .from("ingressos")
    .update({ usado: true, usado_em: new Date().toISOString() })
    .eq("id", ingresso.id);

  return NextResponse.json({ success: true });
}
