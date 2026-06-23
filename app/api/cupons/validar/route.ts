import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface ValidarBody {
  codigo: string;
  preco: number;
}

export async function POST(req: NextRequest) {
  let body: ValidarBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valido: false }, { status: 400 });
  }

  const { codigo, preco } = body;

  if (!codigo || typeof preco !== "number") {
    return NextResponse.json({ valido: false }, { status: 400 });
  }

  const { data: cupom } = await supabaseAdmin
    .from("cupons")
    .select("id, codigo, desconto_percentual, ativo")
    .ilike("codigo", codigo.trim())
    .eq("ativo", true)
    .single();

  if (!cupom) {
    return NextResponse.json({ valido: false });
  }

  const desconto_percentual = cupom.desconto_percentual as number;
  const desconto = Math.round(preco * (desconto_percentual / 100) * 100) / 100;
  const preco_final = Math.max(0, preco - desconto);

  return NextResponse.json({
    valido: true,
    codigo: cupom.codigo as string,
    desconto,
    preco_final,
  });
}
