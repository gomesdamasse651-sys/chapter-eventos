import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("x-admin-password");
  return auth === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("cupons")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cupons: data });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { codigo, criado_por } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("cupons")
    .insert({ codigo: codigo.toUpperCase().trim(), criado_por, usos: 0, ativo: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cupom: data });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id, ativo } = await req.json();
  const { error } = await supabaseAdmin.from("cupons").update({ ativo }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
