import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import * as XLSX from "xlsx";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("x-admin-password");
  return auth === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("ingressos")
    .select("nome, email, telefone, sexo, lote_id, preco, seguro, cupom_id, qr_code, status, paid_at, lotes(numero), cupons(codigo)")
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((i) => ({
    Nome: i.nome,
    Email: i.email,
    Telefone: i.telefone ?? "",
    Sexo: i.sexo,
    Lote: (i.lotes as unknown as { numero: number } | null)?.numero ?? "",
    Preço: `R$ ${i.preco},00`,
    Cupom: (i.cupons as unknown as { codigo: string } | null)?.codigo ?? "",
    Seguro: i.seguro ? "Sim" : "Não",
    QR_Code: i.qr_code ?? "",
    Status: i.status,
    Pago_em: i.paid_at ? new Date(i.paid_at).toLocaleString("pt-BR") : "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ingressos");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="chapter-ingressos-${Date.now()}.xlsx"`,
    },
  });
}
