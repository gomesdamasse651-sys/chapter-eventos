import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { order_nsu, transaction_nsu, capture_method, paid_amount, receipt_url } = body;

  if (!order_nsu) {
    return NextResponse.json({ error: "order_nsu missing" }, { status: 400 });
  }

  const { error } = await supabase
    .from("pedidos")
    .update({
      status: "pago",
      transaction_nsu,
      capture_method,
      paid_amount: paid_amount ? paid_amount / 100 : null,
      receipt_url,
      paid_at: new Date().toISOString(),
    })
    .eq("order_nsu", order_nsu);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
