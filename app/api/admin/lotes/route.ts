import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function getAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabaseAdmin.from("admins").select("role").eq("id", user.id).single();
  return data ?? null;
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .order("numero", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lotes: data });
}
