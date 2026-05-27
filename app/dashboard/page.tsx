"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Ingresso = {
  id: string; nome: string; sexo: string; status: string;
  qr_code: string | null; preco: number; seguro: boolean;
  paid_at: string | null; lotes: { numero: number } | null;
};

export default function Dashboard() {
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      setNomeUsuario(session.user.user_metadata?.nome ?? session.user.email ?? "");
      fetch("/api/cliente/ingressos")
        .then((r) => r.json())
        .then((d) => { setIngressos(d.ingressos ?? []); setLoading(false); });
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://chapter-eventos.vercel.app";

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-600 text-xs tracking-widest uppercase">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
              CHAPTER
            </Link>
            <p className="text-zinc-600 text-xs mt-1">Olá, {nomeUsuario}</p>
          </div>
          <button onClick={logout}
            className="text-xs tracking-widest uppercase text-zinc-600 hover:text-red-400 transition-colors border border-zinc-800 px-3 py-2">
            Sair
          </button>
        </div>

        <div>
          <p className="text-xs tracking-widest uppercase text-zinc-500 border-b border-zinc-900 pb-2 mb-4">
            Meus ingressos
          </p>

          {ingressos.length === 0 ? (
            <div className="text-center py-16 flex flex-col gap-4">
              <p className="text-zinc-600">Nenhum ingresso encontrado.</p>
              <Link href="/comprar"
                className="px-8 py-3 border border-white text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all mx-auto">
                Comprar ingresso
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {ingressos.map((ing) => (
                <div key={ing.id} className="border border-zinc-800 p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{ing.nome}</p>
                      <p className="text-zinc-500 text-xs mt-1">
                        {ing.sexo === "F" ? "Feminino" : "Masculino"} ·
                        Lote {(ing.lotes as unknown as { numero: number } | null)?.numero ?? "-"} ·
                        R$ {ing.preco},00
                        {ing.seguro ? " · Seguro" : ""}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 border ${
                      ing.status === "pago" ? "border-green-500 text-green-400" :
                      ing.status === "usado" ? "border-zinc-600 text-zinc-500" :
                      "border-yellow-600 text-yellow-500"
                    }`}>
                      {ing.status === "usado" ? "Usado" : ing.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </div>

                  {ing.status === "pago" && ing.qr_code && (
                    <div className="flex flex-col items-center gap-3 pt-2 border-t border-zinc-900">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${appUrl}/validar/${ing.qr_code}`)}`}
                        alt="QR Code"
                        className="w-32 h-32"
                      />
                      <p className="text-zinc-700 text-xs font-mono">{ing.qr_code}</p>
                    </div>
                  )}

                  {ing.status === "pendente" && (
                    <p className="text-zinc-600 text-xs">
                      Aguardando confirmação do pagamento.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
