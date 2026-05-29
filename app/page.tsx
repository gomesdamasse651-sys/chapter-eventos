import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import HeroAnimado from "@/components/HeroAnimado";
import NavAnimado from "@/components/NavAnimado";

async function getLoteAtivo() {
  const { data } = await supabaseAdmin
    .from("lotes")
    .select("preco_f, preco_m, vendidos_f, vendidos_m, limite_f, limite_m")
    .eq("ativo", true)
    .single();
  return data;
}

export default async function Home() {
  const lote = await getLoteAtivo();
  const vagasF = lote ? lote.limite_f - lote.vendidos_f : 0;
  const vagasM = lote ? lote.limite_m - lote.vendidos_m : 0;
  const vagasTotal = vagasF + vagasM;
  const esgotado = !lote || vagasTotal <= 0;

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col">
      <NavAnimado />
      <HeroAnimado
        vagasTotal={vagasTotal}
        esgotado={esgotado}
        precoF={lote?.preco_f}
        precoM={lote?.preco_m}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-6 flex items-center justify-between text-[11px] tracking-widest uppercase text-zinc-600 font-[family-name:var(--font-inter)]">
        <div className="flex flex-col gap-0.5">
          <span>Chapter · 2026</span>
          <span className="text-zinc-700 normal-case tracking-normal text-[10px]">
            Desenvolvido por Gabriel Gomes Damasse
          </span>
        </div>
        <span>Entrada exclusiva</span>
        <span>Lote limitado</span>
      </footer>
    </main>
  );
}
