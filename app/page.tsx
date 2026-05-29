import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import HeroAnimado from "@/components/HeroAnimado";
import NavAnimado from "@/components/NavAnimado";
import Countdown from "@/components/Countdown";

async function getLotes() {
  const { data } = await supabaseAdmin
    .from("lotes")
    .select("numero, preco_f, preco_m, vendidos_f, vendidos_m, limite_f, limite_m, ativo")
    .order("numero", { ascending: true });
  return data ?? [];
}

export default async function Home() {
  const lotes = await getLotes();
  const loteAtivo = lotes.find((l) => l.ativo);
  const vagasF = loteAtivo ? loteAtivo.limite_f - loteAtivo.vendidos_f : 0;
  const vagasM = loteAtivo ? loteAtivo.limite_m - loteAtivo.vendidos_m : 0;
  const vagasTotal = vagasF + vagasM;
  const esgotado = !loteAtivo || vagasTotal <= 0;

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col">
      <NavAnimado />
      <HeroAnimado
        vagasTotal={vagasTotal}
        esgotado={esgotado}
        precoF={loteAtivo?.preco_f}
        precoM={loteAtivo?.preco_m}
      />

      {/* Countdown */}
      <section className="flex flex-col items-center gap-4 py-16 border-t border-zinc-900">
        <p className="text-zinc-600 text-[10px] tracking-widest uppercase">Faltam</p>
        <Countdown />
        <p className="text-zinc-700 text-xs tracking-widest uppercase mt-2">01 · Ago · 2026</p>
      </section>

      {/* Descrição */}
      <section className="px-6 py-14 max-w-2xl mx-auto text-center border-t border-zinc-900 w-full">
        <p
          className="text-zinc-300 leading-relaxed"
          style={{ fontSize: "clamp(1rem,2.5vw,1.2rem)", letterSpacing: "0.04em", fontFamily: "var(--font-playfair)" }}
        >
          CHAPTER é mais que uma festa.
          <br />
          <span className="text-zinc-500">
            Uma noite exclusiva, com música e atmosfera única no Lago Sul de Brasília.
          </span>
        </p>
      </section>

      {/* Histórico de lotes */}
      <section className="border-t border-zinc-900 px-6 py-14 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <p className="text-zinc-600 text-[10px] tracking-widest uppercase text-center">Lotes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lotes.map((l) => {
            const encerradoF = l.vendidos_f >= l.limite_f;
            const encerradoM = l.vendidos_m >= l.limite_m;
            const encerrado = encerradoF && encerradoM;
            const isAtivo = l.ativo;
            const isFuturo = !isAtivo && !encerrado && lotes.findIndex((x) => x.ativo) < lotes.findIndex((x) => x.numero === l.numero);

            let statusLabel = "";
            let statusColor = "text-zinc-600";
            if (encerrado) { statusLabel = "Encerrado"; statusColor = "text-zinc-600"; }
            else if (isAtivo) { statusLabel = "Disponível"; statusColor = "text-green-400"; }
            else if (isFuturo) { statusLabel = "Em breve"; statusColor = "text-zinc-500"; }
            else { statusLabel = "Próximo"; statusColor = "text-zinc-400"; }

            return (
              <div
                key={l.numero}
                className={`flex flex-col gap-3 p-6 border transition-all ${
                  isAtivo
                    ? "border-white bg-white/[0.03]"
                    : "border-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs tracking-widest uppercase text-zinc-500">Lote {l.numero}</p>
                  <span className={`text-[10px] tracking-widest uppercase ${statusColor}`}>{statusLabel}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-zinc-300">F — R$ {l.preco_f},00</p>
                  <p className="text-sm text-zinc-300">M — R$ {l.preco_m},00</p>
                </div>
                {isAtivo && (
                  <div className="flex flex-col gap-1 border-t border-zinc-900 pt-3">
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>Feminino</span>
                      <span>{l.vendidos_f}/{l.limite_f}</span>
                    </div>
                    <div className="h-px bg-zinc-900">
                      <div className="h-px bg-white transition-all" style={{ width: `${Math.min(100, (l.vendidos_f / l.limite_f) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>Masculino</span>
                      <span>{l.vendidos_m}/{l.limite_m}</span>
                    </div>
                    <div className="h-px bg-zinc-900">
                      <div className="h-px bg-white transition-all" style={{ width: `${Math.min(100, (l.vendidos_m / l.limite_m) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-10 mt-auto">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs tracking-widest uppercase text-zinc-500">Chapter · Lago Sul · Brasília</p>
            <a href="mailto:contato@chapterbrasilia.com" className="text-zinc-600 text-xs tracking-widest hover:text-white transition-colors">
              contato@chapterbrasilia.com
            </a>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] tracking-widest uppercase text-zinc-700">
            <Link href="/termos" className="hover:text-zinc-400 transition-colors">Termos de uso</Link>
            <Link href="/privacidade" className="hover:text-zinc-400 transition-colors">Privacidade</Link>
            <Link href="/reembolso" className="hover:text-zinc-400 transition-colors">Reembolso</Link>
            <Link href="/suporte" className="hover:text-zinc-400 transition-colors">Suporte</Link>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
            <p className="text-zinc-800 text-[10px] tracking-widest uppercase">© Chapter 2026 — Todos os direitos reservados</p>
            <p className="text-zinc-800 text-[10px]">Desenvolvido por Gabriel Gomes Damasse</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
