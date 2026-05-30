import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConfirmadoPending from "./ConfirmadoPending";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

type IngressoStatus = "pendente" | "pago" | "cancelado";

interface Ingresso {
  id: string;
  nome: string;
  email: string;
  status: IngressoStatus;
  qr_code: string | null;
  categoria: string | null;
  preco: number | null;
  lote_id: string | null;
}

const CATEGORIA_LABEL: Record<string, string> = {
  masc_normal: "Masculino — Normal",
  fem_normal: "Feminino — Normal",
  masc_vip: "Masculino — VIP",
  fem_vip: "Feminino — VIP",
};

export const revalidate = 0;

export default async function ConfirmadoPage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) redirect("/ingressos");

  const { data: ingresso, error } = await supabaseAdmin
    .from("ingressos")
    .select("id, nome, email, status, qr_code, categoria, preco, lote_id")
    .eq("id", id)
    .single();

  if (error || !ingresso) redirect("/ingressos");

  const ing = ingresso as Ingresso;

  if (ing.status === "pendente") {
    return <ConfirmadoPending ingressoId={ing.id} />;
  }

  if (ing.status !== "pago") {
    redirect("/ingressos");
  }

  const qrCode = ing.qr_code!;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://chapter-eventos.vercel.app";

  const validarUrl = `${appUrl}/validar/${qrCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(validarUrl)}`;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        <div>
          <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-2">
            Pagamento confirmado
          </p>
          <h1 className="text-3xl font-bold tracking-tighter">CHAPTER TWO</h1>
          <p className="text-zinc-500 text-sm mt-1">01 de Agosto · Lago Sul</p>
        </div>

        <div className="bg-white p-4 rounded">
          <img
            src={qrImageUrl}
            alt="QR Code do ingresso"
            width={250}
            height={250}
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-white font-medium">{ing.nome}</p>
          {ing.categoria && (
            <p className="text-zinc-400 text-sm">
              {CATEGORIA_LABEL[ing.categoria] ?? ing.categoria}
            </p>
          )}
          {ing.preco != null && (
            <p className="text-zinc-600 text-xs">
              R$ {ing.preco.toFixed(2).replace(".", ",")} · pago
            </p>
          )}
          <p className="text-zinc-700 text-xs font-mono mt-2">{qrCode}</p>
        </div>

        <p className="text-zinc-600 text-xs">
          O QR code também foi enviado para{" "}
          <span className="text-zinc-400">{ing.email}</span>
        </p>

        <Link
          href="/"
          className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Voltar ao início
        </Link>
      </div>
    </main>
  );
}
