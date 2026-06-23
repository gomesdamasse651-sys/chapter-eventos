import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 401 });
  }

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("id, primeiro_acesso")
    .eq("user_id", user.id)
    .single();

  if (!adminUser) {
    return NextResponse.json({ isAdmin: false }, { status: 403 });
  }

  return NextResponse.json({
    isAdmin: true,
    primeiro_acesso: (adminUser as { id: string; primeiro_acesso: boolean }).primeiro_acesso,
  });
}
