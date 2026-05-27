import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { responsavel, participantes, lote_id } = await req.json();

  if (!participantes || participantes.length < 6 || participantes.length > 15) {
    return NextResponse.json({ error: "Grupo deve ter entre 6 e 15 pessoas." }, { status: 400 });
  }

  const { data: lote, error: errLote } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .eq("id", lote_id)
    .eq("ativo", true)
    .single();

  if (errLote || !lote) {
    return NextResponse.json({ error: "Lote não encontrado." }, { status: 400 });
  }

  // Verifica vagas por sexo
  const qtdF = participantes.filter((p: { sexo: string }) => p.sexo === "F").length;
  const qtdM = participantes.filter((p: { sexo: string }) => p.sexo === "M").length;

  if (lote.vendidos_f + qtdF > lote.limite_f) {
    return NextResponse.json({ error: `Vagas femininas insuficientes. Restam ${lote.limite_f - lote.vendidos_f}.` }, { status: 409 });
  }
  if (lote.vendidos_m + qtdM > lote.limite_m) {
    return NextResponse.json({ error: `Vagas masculinas insuficientes. Restam ${lote.limite_m - lote.vendidos_m}.` }, { status: 409 });
  }

  const grupoId = uuidv4();
  const orderNsu = `chapter-grupo-${grupoId}`;

  const total = participantes.reduce((acc: number, p: { sexo: string }) => {
    return acc + (p.sexo === "F" ? lote.preco_f : lote.preco_m);
  }, 0);

  // Cria grupo
  await supabaseAdmin.from("grupos").insert({
    id: grupoId,
    responsavel_nome: responsavel.nome,
    responsavel_email: responsavel.email,
    quantidade: participantes.length,
    total_pago: total,
  });

  // Cria ingressos pendentes
  const ingressos = participantes.map((p: { nome: string; sexo: string }) => ({
    nome: p.nome,
    email: responsavel.email,
    telefone: responsavel.telefone || null,
    sexo: p.sexo,
    lote_id: lote.id,
    preco: p.sexo === "F" ? lote.preco_f : lote.preco_m,
    seguro: false,
    cupom_id: null,
    qr_code: null,
    grupo_id: grupoId,
    status: "pendente",
    order_nsu: orderNsu,
  }));

  await supabaseAdmin.from("ingressos").insert(ingressos);

  // Gera link InfinitePay
  const payload = {
    handle: process.env.INFINITEPAY_HANDLE ?? "tipo_gringofashion",
    order_nsu: orderNsu,
    items: [
      ...(qtdF > 0 ? [{ quantity: qtdF, price: Math.round(lote.preco_f * 100), description: `Ingresso Feminino — Lote ${lote.numero}` }] : []),
      ...(qtdM > 0 ? [{ quantity: qtdM, price: Math.round(lote.preco_m * 100), description: `Ingresso Masculino — Lote ${lote.numero}` }] : []),
    ],
    customer: {
      name: responsavel.nome,
      email: responsavel.email,
      ...(responsavel.telefone ? { phone_number: responsavel.telefone } : {}),
    },
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/webhook-pagamento`,
  };

  const res = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  if (!res.ok) return NextResponse.json({ error: body }, { status: res.status });

  const data = JSON.parse(body);
  return NextResponse.json({ url: data.url ?? data.link ?? data.checkout_url, orderNsu });
}
