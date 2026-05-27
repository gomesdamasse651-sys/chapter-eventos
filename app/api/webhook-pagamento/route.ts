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

  // Busca ingressos pendentes deste pedido
  const { data: ingressos, error: errFetch } = await supabaseAdmin
    .from("ingressos")
    .select("*")
    .eq("order_nsu", order_nsu)
    .eq("status", "pendente");

  if (errFetch || !ingressos || ingressos.length === 0) {
    return NextResponse.json({ error: "Ingressos não encontrados." }, { status: 400 });
  }

  // Gera QR code único para cada ingresso
  const updates = await Promise.all(
    ingressos.map(async (ing) => {
      const qrCode = uuidv4();
      const qrDataUrl = await QRCode.toDataURL(qrCode, { width: 300, margin: 2 });
      return { ...ing, qr_code: qrCode, qr_data_url: qrDataUrl };
    })
  );

  // Atualiza ingressos no Supabase
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
  const qtd = ingressos.length;
  const sexo = ingressos[0].sexo;
  const campo = sexo === "F" ? "vendidos_f" : "vendidos_m";

  const { data: loteAtual } = await supabaseAdmin
    .from("lotes")
    .select("vendidos_f, vendidos_m, limite_f, limite_m, numero")
    .eq("id", lote_id)
    .single();

  if (loteAtual) {
    const novoVendidos = (loteAtual[campo] ?? 0) + qtd;
    await supabaseAdmin.from("lotes").update({ [campo]: novoVendidos }).eq("id", lote_id);

    // Verifica se lote está cheio (F e M atingiram limite) → ativa próximo lote
    const totalF = campo === "vendidos_f" ? novoVendidos : loteAtual.vendidos_f;
    const totalM = campo === "vendidos_m" ? novoVendidos : loteAtual.vendidos_m;
    if (totalF >= loteAtual.limite_f && totalM >= loteAtual.limite_m) {
      // Desativa lote atual
      await supabaseAdmin.from("lotes").update({ ativo: false }).eq("id", lote_id);
      // Ativa próximo lote
      await supabaseAdmin
        .from("lotes")
        .update({ ativo: true })
        .eq("numero", loteAtual.numero + 1);
    }
  }

  // Atualiza uso do cupom
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
  const primeiroIngresso = ingressos[0];
  const qrCodesHtml = updates
    .map(
      (ing, i) => `
      <div style="margin-bottom:32px;text-align:center;">
        <p style="font-family:monospace;font-size:12px;color:#666;">Ingresso ${i + 1} de ${updates.length}</p>
        <img src="${ing.qr_data_url}" alt="QR Code" style="width:200px;height:200px;" />
        <p style="font-family:monospace;font-size:10px;color:#999;margin-top:8px;">${ing.qr_code}</p>
      </div>
    `
    )
    .join("");

  await resend.emails.send({
    from: "Chapter <noreply@chapter.com.br>",
    to: primeiroIngresso.email,
    subject: "Seu ingresso Chapter — 15 de Junho",
    html: `
      <div style="background:#000;color:#fff;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="font-size:32px;font-weight:bold;letter-spacing:-1px;margin-bottom:8px;">CHAPTER</h1>
        <p style="color:#666;font-size:12px;letter-spacing:4px;text-transform:uppercase;">15 de Junho · Lago Sul</p>
        <hr style="border-color:#222;margin:32px 0;" />
        <p style="color:#fff;">Olá, <strong>${primeiroIngresso.nome}</strong>!</p>
        <p style="color:#aaa;">Seu pagamento foi confirmado. Apresente o(s) QR code(s) abaixo na entrada do evento.</p>
        <hr style="border-color:#222;margin:32px 0;" />
        ${qrCodesHtml}
        <hr style="border-color:#222;margin:32px 0;" />
        <p style="color:#444;font-size:11px;">Chapter · 2025</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
