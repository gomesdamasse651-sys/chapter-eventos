import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/admin-auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("ingressos")
    .select("nome, email, telefone, sexo, preco, seguro, qr_code, status, paid_at, lotes(numero), cupons(codigo)")
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
