import Link from "next/link";
import { supabase } from "@/lib/supabase";

const VAGAS_TOTAL = 200;

async function getVagasRestantes() {
  const { data } = await supabase
    .from("pedidos")
    .select("quantidade")
    .neq("status", "cancelado");

  const usadas = data?.reduce((acc, p) => acc + p.quantidade, 0) ?? 0;
  return Math.max(0, VAGAS_TOTAL - usadas);
}

export default async function Home() {
  const vagas = await getVagasRestantes();
  const esgotado = vagas === 0;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <p className="text-xs tracking-[0.4em] text-zinc-400 uppercase">15 de junho de 2025</p>
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white">
            CHAPTER
          </h1>
          <p className="text-zinc-400 text-sm tracking-widest uppercase">Lago Sul · QI 11 Conjunto 10</p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-zinc-500 text-xs tracking-widest uppercase">Ingresso</p>
            <p className="text-4xl font-light">R$ 35</p>
          </div>

          {/* Contador de vagas */}
          <div className="flex flex-col items-center gap-1">
            {esgotado ? (
              <p className="text-red-500 text-xs tracking-widest uppercase">Esgotado</p>
            ) : (
              <p className="text-zinc-500 text-xs tracking-widest">
                <span className={vagas <= 20 ? "text-red-400" : "text-zinc-300"}>{vagas}</span>
                {" "}vagas restantes
              </p>
            )}
          </div>

          {esgotado ? (
            <span className="mt-6 px-10 py-3 border border-zinc-700 text-sm tracking-widest uppercase text-zinc-600 cursor-not-allowed">
              Esgotado
            </span>
          ) : (
            <Link
              href="/comprar"
              className="mt-6 px-10 py-3 border border-white text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
            >
              Garantir vaga
            </Link>
          )}
        </div>
      </section>

      {/* Info */}
      <section className="border-t border-zinc-900 px-4 py-20 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div>
            <p className="text-zinc-600 text-xs tracking-widest uppercase mb-2">Data</p>
            <p className="text-white">15 de Junho, 2025</p>
          </div>
          <div>
            <p className="text-zinc-600 text-xs tracking-widest uppercase mb-2">Local</p>
            <p className="text-white">Lago Sul</p>
            <p className="text-zinc-500 text-sm">QI 11 Conjunto 10</p>
          </div>
          <div>
            <p className="text-zinc-600 text-xs tracking-widest uppercase mb-2">Ingresso</p>
            <p className="text-white">R$ 35,00</p>
            <p className="text-zinc-500 text-sm">InfinitePay</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!esgotado && (
        <section className="border-t border-zinc-900 px-4 py-20 flex flex-col items-center gap-6">
          <h2 className="text-3xl font-light tracking-tight">Pronto para a noite?</h2>
          <Link
            href="/comprar"
            className="px-10 py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all duration-300"
          >
            Comprar ingresso
          </Link>
        </section>
      )}

      <footer className="border-t border-zinc-900 px-4 py-8 text-center">
        <p className="text-zinc-700 text-xs tracking-widest">CHAPTER · 2025</p>
      </footer>
    </main>
  );
}
