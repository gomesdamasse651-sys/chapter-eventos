import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { incrementarVendido } from "@/lib/lotes";
import type { Categoria, Lote } from "@/lib/lotes";
import { v4 as uuidv4 } from "uuid";

const PRECO_SEGURO_REAIS = 25;

const CATEGORIAS_VALIDAS: Categoria[] = [
  "masc_normal",
  "fem_normal",
  "masc_vip",
  "fem_vip",
];

function getPrecoCategoria(lote: Lote, categoria: Categoria): number {
  return lote[`${categoria}_preco`] as number;
}

function getVendidosCategoria(lote: Lote, categoria: Categoria): number {
  return lote[`${categoria}_vendidos`] as number;
}

function getTotalCategoria(lote: Lote, categoria: Categoria): number {
  return lote[`${categoria}_total`] as number;
}

interface CheckoutBody {
  lote_id: number | string;
  categoria: string;
  nome: string;
  email: string;
  telefone?: string;
  seguro_reembolso?: boolean;
  codigo_cupom?: string;
  desconto?: number;
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { lote_id, categoria, nome, email, telefone, seguro_reembolso = false, codigo_cupom, desconto: descontoCliente } = body;

  if (!lote_id || !categoria || !nome || !email) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria as Categoria)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const cat = categoria as Categoria;

  // Busca lote ativo
  const { data: lote, error: errLote } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .eq("id", lote_id)
    .eq("ativo", true)
    .single();

  if (errLote || !lote) {
    return NextResponse.json({ error: "Lote não encontrado ou inativo." }, { status: 400 });
  }

  const loteTyped = lote as Lote;
  const vendidos = getVendidosCategoria(loteTyped, cat);
  const total = getTotalCategoria(loteTyped, cat);

  if (vendidos >= total) {
    return NextResponse.json(
      { error: `Categoria ${cat} esgotada neste lote.` },
      { status: 409 }
    );
  }

  const precoReais = getPrecoCategoria(loteTyped, cat);

  // Revalida cupom no servidor se fornecido
  let descontoFinal = 0;
  let cupomId: string | null = null;
  if (codigo_cupom) {
    const { data: cupom } = await supabaseAdmin
      .from("cupons")
      .select("id, desconto_percentual, ativo")
      .ilike("codigo", codigo_cupom.trim())
      .eq("ativo", true)
      .single();

    if (cupom) {
      const percentual = cupom.desconto_percentual as number;
      descontoFinal = Math.round(precoReais * (percentual / 100) * 100) / 100;
      cupomId = cupom.id as string;
    }
    // Se cupom inválido no servidor, ignora desconto silenciosamente
    void descontoCliente; // cliente enviou mas não confiamos
  }

  const precoComDesconto = Math.max(0, precoReais - descontoFinal);
  const totalReais = precoComDesconto + (seguro_reembolso ? PRECO_SEGURO_REAIS : 0);
  const totalCentavos = Math.round(totalReais * 100);

  const orderNsu = `chapter-${uuidv4()}`;

  const sexo = cat.startsWith("masc") ? "M" : "F";

  // Cria ingresso pendente
  const { data: ingresso, error: errInsert } = await supabaseAdmin
    .from("ingressos")
    .insert({
      nome,
      email,
      telefone: telefone || null,
      sexo,
      lote_id: lote.id,
      categoria: cat,
      seguro: seguro_reembolso,
      seguro_reembolso,
      preco: totalReais,
      status: "pendente",
      order_nsu: orderNsu,
    })
    .select("id")
    .single();

  if (errInsert || !ingresso) {
    console.error("INSERT ERROR:", JSON.stringify(errInsert));
    return NextResponse.json({ error: "Erro ao registrar pedido." }, { status: 500 });
  }

  // Incrementa usos do cupom
  if (cupomId) {
    await supabaseAdmin.rpc("increment_cupom_usos", { cupom_id: cupomId });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://chapter-eventos.vercel.app";

  const redirectUrl = `${appUrl}/ingresso/confirmado?id=${ingresso.id}`;
  const webhookUrl = `${appUrl}/api/webhook/infinitepay`;

  const isHttps = appUrl.startsWith("https://");

  const items: { quantity: number; price: number; description: string }[] = [
    {
      quantity: 1,
      price: Math.round(precoComDesconto * 100),
      description: `Ingresso Chapter — 15/08/2026 (${cat.replace("_", " ")})`,
    },
  ];

  if (seguro_reembolso) {
    items.push({
      quantity: 1,
      price: Math.round(PRECO_SEGURO_REAIS * 100),
      description: "Seguro Reembolsável",
    });
  }

  const payload = {
    handle: process.env.INFINITEPAY_HANDLE,
    order_nsu: orderNsu,
    items,
    ...(isHttps ? { redirect_url: redirectUrl } : {}),
    ...(isHttps ? { webhook_url: webhookUrl } : {}),
    customer: {
      name: nome,
      email,
      ...(telefone ? { phone_number: telefone } : {}),
    },
  };

  const ipRes = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const ipBody = await ipRes.text();

  if (!ipRes.ok) {
    // Rollback ingresso
    await supabaseAdmin.from("ingressos").delete().eq("id", ingresso.id);
    return NextResponse.json({ error: ipBody }, { status: ipRes.status });
  }

  const ipData = JSON.parse(ipBody) as Record<string, unknown>;
  const checkoutUrl =
    (ipData.url ?? ipData.link ?? ipData.checkout_url) as string | undefined;

  return NextResponse.json({ checkout_url: checkoutUrl, order_nsu: orderNsu });
}
