import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

const PRECO_SEGURO = 11.9;

export async function POST(req: NextRequest) {
  const { nome, email, telefone, quantidade, sexo, cupom_id, seguro, lote_id } = await req.json();

  if (!sexo || !["F", "M"].includes(sexo)) {
    return NextResponse.json({ error: "Sexo inválido." }, { status: 400 });
  }

  // Busca lote ativo
  const { data: lote, error: errLote } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .eq("id", lote_id)
    .eq("ativo", true)
    .single();

  if (errLote || !lote) {
    return NextResponse.json({ error: "Lote não encontrado." }, { status: 400 });
  }

  // Verifica vagas no lote por sexo
  const vendidos = sexo === "F" ? lote.vendidos_f : lote.vendidos_m;
  const limite = sexo === "F" ? lote.limite_f : lote.limite_m;
  if (vendidos + quantidade > limite) {
    const restam = limite - vendidos;
    return NextResponse.json(
      { error: `Só restam ${restam} vaga(s) ${sexo === "F" ? "feminina(s)" : "masculina(s)"} neste lote.` },
      { status: 409 }
    );
  }

  const preco = sexo === "F" ? lote.preco_f : lote.preco_m;
  let subtotal = preco * quantidade;

  // Aplica desconto de cupom
  let desconto = 0;
  if (cupom_id) {
    desconto = Math.round(subtotal * 0.1 * 100) / 100;
    subtotal = subtotal - desconto;
  }

  const seguroTotal = seguro ? PRECO_SEGURO * quantidade : 0;
  const total = subtotal + seguroTotal;

  const orderNsu = `chapter-${uuidv4()}`;

  // Cria registros pendentes no Supabase (um por ingresso)
  const ingressos = Array.from({ length: quantidade }, () => ({
    nome,
    email,
    telefone: telefone || null,
    sexo,
    lote_id: lote.id,
    preco,
    seguro: seguro ?? false,
    cupom_id: cupom_id || null,
    qr_code: null, // gerado após pagamento
    grupo_id: null,
    status: "pendente",
    order_nsu: orderNsu,
  }));

  const { error: errInsert } = await supabaseAdmin.from("ingressos").insert(ingressos);

  if (errInsert) {
    return NextResponse.json({ error: "Erro ao registrar pedido." }, { status: 500 });
  }

  // Gera link InfinitePay
  const payload = {
    handle: process.env.INFINITEPAY_HANDLE ?? "tipo_gringofashion",
    order_nsu: orderNsu,
    items: [
      {
        quantity: quantidade,
        price: Math.round(preco * 100),
        description: `Ingresso Chapter ${sexo === "F" ? "Feminino" : "Masculino"} — Lote ${lote.numero}`,
      },
      ...(seguro
        ? [{ quantity: quantidade, price: Math.round(PRECO_SEGURO * 100), description: "Seguro Reembolsável" }]
        : []),
    ],
    customer: {
      name: nome,
      email,
      ...(telefone ? { phone_number: telefone } : {}),
    },
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/webhook-pagamento`,
  };

  const res = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  if (!res.ok) {
    return NextResponse.json({ error: body }, { status: res.status });
  }

  const data = JSON.parse(body);
  const checkoutUrl = data.url ?? data.link ?? data.checkout_url;

  return NextResponse.json({ url: checkoutUrl, orderNsu });
}
