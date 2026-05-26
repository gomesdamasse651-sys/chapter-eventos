import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VAGAS_TOTAL = 200;

export async function POST(req: NextRequest) {
  const { nome, email, telefone, quantidade } = await req.json();

  // Verifica vagas disponíveis
  const { data: vendas, error: errVendas } = await supabase
    .from("pedidos")
    .select("quantidade")
    .neq("status", "cancelado");

  if (errVendas) {
    return NextResponse.json({ error: "Erro ao verificar vagas." }, { status: 500 });
  }

  const vagasUsadas = vendas?.reduce((acc, p) => acc + p.quantidade, 0) ?? 0;
  const vagasRestantes = VAGAS_TOTAL - vagasUsadas;

  if (quantidade > vagasRestantes) {
    return NextResponse.json(
      { error: `Só restam ${vagasRestantes} vaga(s).` },
      { status: 409 }
    );
  }

  const preco = 3500; // R$35 em centavos
  const orderNsu = `chapter-${Date.now()}`;

  const payload = {
    handle: "tipo_gringofashion",
    order_nsu: orderNsu,
    items: [
      {
        quantity: quantidade,
        price: preco,
        description: "Ingresso Chapter — 15 de Junho",
      },
    ],
    customer: {
      name: nome,
      email: email,
      ...(telefone ? { phone_number: telefone } : {}),
    },
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

  // Salva pedido como "pendente" no Supabase
  await supabase.from("pedidos").insert({
    order_nsu: orderNsu,
    nome,
    email,
    telefone: telefone || null,
    quantidade,
    valor_total: quantidade * 35,
    status: "pendente",
    checkout_url: checkoutUrl,
  });

  return NextResponse.json({ url: checkoutUrl, orderNsu });
}
