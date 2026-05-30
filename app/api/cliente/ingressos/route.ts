import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("ingressos")
    .select("id, nome, sexo, status, qr_code, preco, seguro, seguro_reembolso, paid_at, categoria, reembolso_solicitado, reembolso_solicitado_em, reembolso_pago, lotes(numero)")
    .eq("email", user.email!)
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ingressos: data });
}
