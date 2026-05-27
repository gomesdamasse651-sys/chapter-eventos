import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .eq("ativo", true)
    .order("numero", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ lote: null }, { status: 404 });
  }

  return NextResponse.json({ lote: data });
}
