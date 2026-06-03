import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { incrementarVendido } from "@/lib/lotes";
import type { Categoria } from "@/lib/lotes";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

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

  const qrCode = uuidv4();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://chapter-eventos.vercel.app";

  await QRCode.toDataURL(qrCode, { width: 300, margin: 2 });

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
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validarUrl)}`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Chapter <noreply@resend.dev>",
      to: ingresso.email as string,
      subject: "Seu ingresso Chapter — 04 de Julho",
      html: `
        <div style="background:#000;color:#fff;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h1 style="font-size:32px;font-weight:bold;letter-spacing:-1px;margin:0 0 4px;">CHAPTER</h1>
          <p style="color:#555;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 32px;">04 de Julho · A definir · Brasília</p>
          <p style="color:#ccc;margin-bottom:8px;">Olá, <strong>${ingresso.nome as string}</strong>!</p>
          <p style="color:#888;margin-bottom:32px;">Pagamento confirmado. Apresente o QR code na entrada.</p>
          <hr style="border:none;border-top:1px solid #222;margin:0 0 32px;" />
          <div style="text-align:center;margin-bottom:32px;">
            <img src="${qrImageUrl}" alt="QR Code" width="200" height="200" style="display:block;margin:0 auto;" />
            <p style="font-family:monospace;font-size:10px;color:#555;margin-top:8px;">${qrCode}</p>
            <a href="${validarUrl}" style="font-size:11px;color:#aaa;">Ver ingresso online</a>
          </div>
          <hr style="border:none;border-top:1px solid #222;margin:32px 0 16px;" />
          <p style="color:#444;font-size:11px;margin:0;">Chapter · 2026</p>
        </div>
      `,
    });
  } catch {
    // Email não crítico
  }

  return NextResponse.json({ ok: true });
}
