import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_nsu, transaction_nsu, capture_method, paid_amount, receipt_url } = body;

  if (!order_nsu) {
    return NextResponse.json({ error: "order_nsu missing" }, { status: 400 });
  }

  // Busca ingressos pendentes
  const { data: ingressos, error: errFetch } = await supabaseAdmin
    .from("ingressos")
    .select("*")
    .eq("order_nsu", order_nsu)
    .eq("status", "pendente");

  if (errFetch || !ingressos || ingressos.length === 0) {
    return NextResponse.json({ error: "Ingressos não encontrados." }, { status: 400 });
  }

  // Gera QR code único por ingresso
  const updates = await Promise.all(
    ingressos.map(async (ing) => {
      const qrCode = uuidv4();
      const qrDataUrl = await QRCode.toDataURL(qrCode, { width: 300, margin: 2 });
      return { ...ing, qr_code: qrCode, qr_data_url: qrDataUrl };
    })
  );

  // Atualiza ingressos
  await Promise.all(
    updates.map((ing) =>
      supabaseAdmin
        .from("ingressos")
        .update({
          status: "pago",
          qr_code: ing.qr_code,
          transaction_nsu,
          capture_method,
          paid_amount: paid_amount ? paid_amount / 100 : null,
          receipt_url,
          paid_at: new Date().toISOString(),
        })
        .eq("id", ing.id)
    )
  );

  // Atualiza contagem do lote
  const lote_id = ingressos[0].lote_id;
  const sexo = ingressos[0].sexo;
  const qtd = ingressos.length;
  const campo = sexo === "F" ? "vendidos_f" : "vendidos_m";

  const { data: loteAtual } = await supabaseAdmin
    .from("lotes")
    .select("vendidos_f, vendidos_m, limite_f, limite_m, numero")
    .eq("id", lote_id)
    .single();

  if (loteAtual) {
    const novoVendidos = (loteAtual[campo] ?? 0) + qtd;
    await supabaseAdmin.from("lotes").update({ [campo]: novoVendidos }).eq("id", lote_id);

    const totalF = campo === "vendidos_f" ? novoVendidos : loteAtual.vendidos_f;
    const totalM = campo === "vendidos_m" ? novoVendidos : loteAtual.vendidos_m;

    if (totalF >= loteAtual.limite_f && totalM >= loteAtual.limite_m) {
      await supabaseAdmin.from("lotes").update({ ativo: false }).eq("id", lote_id);
      await supabaseAdmin
        .from("lotes")
        .update({ ativo: true })
        .eq("numero", loteAtual.numero + 1);
    }
  }

  // Incrementa uso do cupom
  const cupom_id = ingressos[0].cupom_id;
  if (cupom_id) {
    const { data: cupom } = await supabaseAdmin
      .from("cupons")
      .select("usos")
      .eq("id", cupom_id)
      .single();
    if (cupom) {
      await supabaseAdmin.from("cupons").update({ usos: (cupom.usos ?? 0) + 1 }).eq("id", cupom_id);
    }
  }

  // Envia email com QR codes
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const primeiroIngresso = ingressos[0];

  const qrCodesHtml = updates
    .map(
      (ing, i) => `
      <div style="margin-bottom:32px;text-align:center;">
        <p style="font-family:monospace;font-size:12px;color:#666;margin-bottom:8px;">
          Ingresso ${i + 1} de ${updates.length}
        </p>
        <img src="${ing.qr_data_url}" alt="QR Code" style="width:200px;height:200px;display:block;margin:0 auto;" />
        <p style="font-family:monospace;font-size:10px;color:#555;margin-top:8px;">${ing.qr_code}</p>
        <a href="${appUrl}/validar/${ing.qr_code}" style="font-size:10px;color:#888;">Ver ingresso online</a>
      </div>
    `
    )
    .join("");

  await resend.emails.send({
    from: "Chapter <noreply@resend.dev>",
    to: primeiroIngresso.email,
    subject: "Seu ingresso Chapter — 15 de Junho",
    html: `
      <div style="background:#000;color:#fff;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="font-size:32px;font-weight:bold;letter-spacing:-1px;margin:0 0 4px;">CHAPTER</h1>
        <p style="color:#555;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 32px;">15 de Junho · Lago Sul · QI 11 Conjunto 10</p>
        <p style="color:#ccc;margin-bottom:8px;">Olá, <strong>${primeiroIngresso.nome}</strong>!</p>
        <p style="color:#888;margin-bottom:32px;">Pagamento confirmado. Apresente o QR code abaixo na entrada do evento.</p>
        <hr style="border:none;border-top:1px solid #222;margin:0 0 32px;" />
        ${qrCodesHtml}
        <hr style="border:none;border-top:1px solid #222;margin:32px 0 16px;" />
        <p style="color:#444;font-size:11px;margin:0;">Chapter · 2025 · Dúvidas? Responda este email.</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
