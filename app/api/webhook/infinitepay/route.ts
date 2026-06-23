import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { incrementarVendido } from "@/lib/lotes";
import type { Categoria } from "@/lib/lotes";
import { v4 as uuidv4 } from "uuid";

const CATEGORIA_LABEL: Record<string, string> = {
  masc_normal: "Masculino — Normal",
  fem_normal: "Feminino — Normal",
  masc_vip: "Masculino — VIP",
  fem_vip: "Feminino — VIP",
};

const CATEGORIAS_VALIDAS: Categoria[] = [
  "masc_normal",
  "fem_normal",
  "masc_vip",
  "fem_vip",
];

export async function POST(req: NextRequest) {
  const secret = process.env.INFINITEPAY_WEBHOOK_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const order_nsu = body.order_nsu as string | undefined;
  const transaction_nsu = body.transaction_nsu as string | undefined;
  const capture_method = body.capture_method as string | undefined;
  const paid_amount = body.paid_amount as number | undefined;

  if (!order_nsu) {
    return NextResponse.json({ error: "order_nsu ausente." }, { status: 400 });
  }

  // Busca ingresso pendente pelo order_nsu
  const { data: ingresso, error: errFetch } = await supabaseAdmin
    .from("ingressos")
    .select("*")
    .eq("order_nsu", order_nsu)
    .eq("status", "pendente")
    .single();

  if (errFetch || !ingresso) {
    // Idempotente — já processado
    return NextResponse.json({ ok: true, skipped: true });
  }

  const qrCode = (ingresso.qr_code as string | null) ?? uuidv4();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://chapterbsb.vercel.app";

  await supabaseAdmin
    .from("ingressos")
    .update({
      status: "pago",
      qr_code: qrCode,
      transaction_nsu: transaction_nsu ?? null,
      capture_method: capture_method ?? null,
      paid_amount: paid_amount != null ? paid_amount / 100 : null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", ingresso.id);

  // Incrementa vendidos no lote
  const categoria = ingresso.categoria as string | null;
  if (ingresso.lote_id && categoria && CATEGORIAS_VALIDAS.includes(categoria as Categoria)) {
    await incrementarVendido(ingresso.lote_id as number, categoria as Categoria);
  }

  // Envia email com QR code
  const validarUrl = `${appUrl}/validar/${qrCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(validarUrl)}`;
  const categoriaLabel = categoria ? (CATEGORIA_LABEL[categoria] ?? categoria) : "—";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Chapter <onboarding@resend.dev>",
      to: ingresso.email as string,
      subject: "Seu ingresso Chapter — 15 de Agosto",
      html: `
        <div style="background:#000;color:#fff;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h1 style="font-size:36px;font-weight:bold;letter-spacing:2px;margin:0 0 4px;">CHAPTER</h1>
          <p style="color:#555;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 32px;">15 de Agosto · Acadêmicos da Asa Norte · Brasília</p>

          <p style="color:#ccc;margin-bottom:4px;">Olá, <strong style="color:#fff;">${ingresso.nome as string}</strong>!</p>
          <p style="color:#888;margin-bottom:32px;">Pagamento confirmado. Seu ingresso está garantido.</p>

          <hr style="border:none;border-top:1px solid #222;margin:0 0 32px;" />

          <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
            <tr>
              <td style="color:#555;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:8px 0;">Data</td>
              <td style="color:#ccc;font-size:13px;padding:8px 0;">15 de Agosto de 2026 às 21h</td>
            </tr>
            <tr>
              <td style="color:#555;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:8px 0;">Local</td>
              <td style="color:#ccc;font-size:13px;padding:8px 0;">Acadêmicos da Asa Norte, Brasília</td>
            </tr>
            <tr>
              <td style="color:#555;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:8px 0;">Ingresso</td>
              <td style="color:#ccc;font-size:13px;padding:8px 0;">${categoriaLabel}</td>
            </tr>
          </table>

          <div style="text-align:center;margin-bottom:32px;">
            <img src="${qrImageUrl}" alt="QR Code" width="300" height="300" style="display:block;margin:0 auto;background:#fff;padding:12px;" />
            <p style="font-family:monospace;font-size:10px;color:#444;margin-top:12px;">${qrCode}</p>
            <a href="${validarUrl}" style="font-size:11px;color:#777;text-decoration:none;">Ver ingresso online →</a>
          </div>

          <div style="background:#111;padding:16px;text-align:center;margin-bottom:32px;">
            <p style="color:#aaa;font-size:12px;margin:0;">Apresente este QR code na entrada. Documento obrigatório.</p>
          </div>

          <hr style="border:none;border-top:1px solid #1a1a1a;margin:0 0 16px;" />
          <p style="color:#333;font-size:11px;margin:0;">Open bar exclusivo · +18 · Chapter 2026</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("[webhook] erro ao enviar email:", emailErr);
    // Email não crítico — pagamento já confirmado
  }

  return NextResponse.json({ ok: true });
}
