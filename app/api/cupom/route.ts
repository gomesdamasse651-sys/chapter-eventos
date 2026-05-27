import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("codigo");

  if (!codigo) {
    return NextResponse.json({ valido: false, erro: "Código inválido." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("cupons")
    .select("id, codigo, ativo")
    .eq("codigo", codigo.toUpperCase())
    .eq("ativo", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ valido: false, erro: "Cupom não encontrado ou inativo." }, { status: 404 });
  }

  return NextResponse.json({ valido: true, id: data.id });
}
