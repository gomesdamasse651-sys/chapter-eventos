import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";

export default async function ValidarIngresso({ params }: { params: Promise<{ qr_code: string }> }) {
  const { qr_code } = await params;

  const { data: ingresso } = await supabaseAdmin
    .from("ingressos")
    .select("nome, sexo, lote_id, status, paid_at, lotes(numero)")
    .eq("qr_code", qr_code)
    .single();

  const valido = ingresso?.status === "pago";

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tighter">CHAPTER</h1>

        <div className={`w-full border p-8 flex flex-col gap-4 ${valido ? "border-green-500" : "border-red-500"}`}>
          <div className={`text-4xl font-bold ${valido ? "text-green-400" : "text-red-400"}`}>
            {valido ? "✓ VÁLIDO" : "✗ INVÁLIDO"}
          </div>

          {ingresso ? (
            <>
              <div>
                <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">Nome</p>
                <p className="text-white text-lg">{ingresso.nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">Sexo</p>
                  <p className="text-white">{ingresso.sexo === "F" ? "Feminino" : "Masculino"}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">Lote</p>
                  <p className="text-white">{(ingresso.lotes as unknown as { numero: number } | null)?.numero ?? "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">Status</p>
                <p className={`font-medium ${ingresso.status === "pago" ? "text-green-400" : ingresso.status === "reembolsado" ? "text-yellow-400" : "text-red-400"}`}>
                  {ingresso.status.toUpperCase()}
                </p>
              </div>
            </>
          ) : (
            <p className="text-zinc-400">QR code não encontrado.</p>
          )}
        </div>

        <Link href="/" className="text-zinc-700 text-xs tracking-widest uppercase hover:text-white transition-colors">
          ← Início
        </Link>
      </div>
    </main>
  );
}
