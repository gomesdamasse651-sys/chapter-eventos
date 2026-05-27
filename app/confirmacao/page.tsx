import { supabaseAdmin } from "@/lib/supabase";
import QRCode from "qrcode";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ order_nsu?: string }>;
}

export default async function Confirmacao({ searchParams }: Props) {
  const { order_nsu } = await searchParams;

  if (!order_nsu) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-500">Link inválido.</p>
          <Link href="/" className="text-xs tracking-widest uppercase text-zinc-600 hover:text-white mt-4 block">← Início</Link>
        </div>
      </main>
    );
  }

  const { data: ingressos } = await supabaseAdmin
    .from("ingressos")
    .select("id, nome, sexo, status, qr_code, preco, seguro, lotes(numero)")
    .eq("order_nsu", order_nsu);

  if (!ingressos || ingressos.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tighter">CHAPTER</h1>
          <p className="text-zinc-500">Pedido não encontrado.</p>
          <Link href="/" className="text-xs tracking-widest uppercase text-zinc-600 hover:text-white">← Início</Link>
        </div>
      </main>
    );
  }

  const pagos = ingressos.filter((i) => i.status === "pago");
  const pendentes = ingressos.filter((i) => i.status === "pendente");
  const primeiro = ingressos[0];

  // Gera QR code images para os pagos
  const qrImages = await Promise.all(
    pagos.map(async (ing) => {
      if (!ing.qr_code) return null;
      const dataUrl = await QRCode.toDataURL(ing.qr_code, { width: 256, margin: 2 });
      return { ...ing, qr_data_url: dataUrl };
    })
  );

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-2">Chapter</p>
          <h1 className="text-4xl font-bold tracking-tighter">15 de Junho</h1>
          <p className="text-zinc-500 text-sm mt-1">Lago Sul · QI 11 Conjunto 10</p>
        </div>

        {pendentes.length > 0 && pagos.length === 0 && (
          <div className="w-full border border-zinc-800 p-6 text-center flex flex-col gap-3">
            <div className="text-yellow-400 text-2xl">⏳</div>
            <p className="text-white">Pagamento em processamento</p>
            <p className="text-zinc-500 text-sm">
              Assim que confirmado, você receberá os QR codes no email <strong>{primeiro.nome}</strong>.
            </p>
            <p className="text-zinc-600 text-xs">Pedido: {order_nsu}</p>
          </div>
        )}

        {pagos.length > 0 && (
          <div className="w-full flex flex-col gap-6">
            <div className="text-center">
              <div className="text-green-400 text-3xl mb-2">✓</div>
              <p className="text-white font-medium">Pagamento confirmado!</p>
              <p className="text-zinc-500 text-sm mt-1">
                {primeiro.nome} · {pagos.length} {pagos.length === 1 ? "ingresso" : "ingressos"}
              </p>
            </div>

            {qrImages.map((ing, i) => ing && (
              <div key={ing.id} className="border border-zinc-800 p-6 flex flex-col items-center gap-4">
                <p className="text-zinc-600 text-xs tracking-widest uppercase">
                  Ingresso {i + 1} de {pagos.length} · {ing.sexo === "F" ? "Feminino" : "Masculino"}
                </p>
                <img
                  src={ing.qr_data_url}
                  alt={`QR Code ${i + 1}`}
                  className="w-48 h-48"
                />
                <p className="text-zinc-700 text-xs font-mono break-all text-center">{ing.qr_code}</p>
                <Link
                  href={`/validar/${ing.qr_code}`}
                  className="text-xs tracking-widest uppercase text-zinc-600 hover:text-white transition-colors"
                >
                  Verificar ingresso →
                </Link>
              </div>
            ))}

            <p className="text-zinc-600 text-xs text-center">
              Os QR codes também foram enviados para o seu email.
            </p>
          </div>
        )}

        <Link href="/" className="text-zinc-700 text-xs tracking-widest uppercase hover:text-white transition-colors">
          ← Início
        </Link>
      </div>
    </main>
  );
}
