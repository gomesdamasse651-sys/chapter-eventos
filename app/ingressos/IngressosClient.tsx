"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Lote } from "@/lib/lotes";

type Props = { lote: Lote | null };

function vagasRestantes(lote: Lote): number {
  return (
    (lote.masc_normal_total - lote.masc_normal_vendidos) +
    (lote.fem_normal_total - lote.fem_normal_vendidos) +
    (lote.masc_vip_total - lote.masc_vip_vendidos) +
    (lote.fem_vip_total - lote.fem_vip_vendidos)
  );
}

function esgotado(lote: Lote): boolean {
  return vagasRestantes(lote) <= 0;
}

type LinhaProps = {
  label: string;
  preco: number;
  vagas: number;
  loteId: string;
  categoria: string;
  isVip?: boolean;
};

function LinhaIngresso({ label, preco, vagas, loteId, categoria, isVip }: LinhaProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1a2e26]/60 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-white text-sm">{label}</span>
        {isVip && (
          <span className="text-[10px] tracking-widest uppercase border border-[#a8ff78] text-[#a8ff78] px-2 py-0.5">
            VIP
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[#a8ff78] font-light">R$ {preco.toFixed(0)},00</span>
        {vagas > 0 ? (
          <Link
            href={`/comprar?lote_id=${loteId}&categoria=${categoria}`}
            className="text-xs tracking-widest uppercase border border-[#1a2e26] bg-[#1a2e26] text-white px-4 py-2 hover:bg-[#22392e] transition-colors"
          >
            Comprar
          </Link>
        ) : (
          <span className="text-xs tracking-widest uppercase text-zinc-700 px-4 py-2">
            Esgotado
          </span>
        )}
      </div>
    </div>
  );
}

export default function IngressosClient({ lote }: Props) {
  if (!lote) {
    return (
      <main className="min-h-screen bg-[#0a0f0d] text-white flex flex-col items-center justify-center px-4">
        <p className="text-zinc-500 text-sm tracking-widest uppercase">
          Aguardando próximo lote...
        </p>
      </main>
    );
  }

  const semVagas = esgotado(lote);

  const vagasMascNormal = lote.masc_normal_total - lote.masc_normal_vendidos;
  const vagasFemNormal = lote.fem_normal_total - lote.fem_normal_vendidos;
  const vagasMascVip = lote.masc_vip_total - lote.masc_vip_vendidos;
  const vagasFemVip = lote.fem_vip_total - lote.fem_vip_vendidos;
  const totalVagas = vagasMascNormal + vagasFemNormal + vagasMascVip + vagasFemVip;

  return (
    <main className="min-h-screen bg-[#0a0f0d] text-white flex flex-col items-center justify-center px-4 py-20">
      <motion.div
        className="w-full max-w-lg flex flex-col gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Link
          href="/"
          className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Voltar
        </Link>

        <div>
          <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-2">
            Ingressos
          </p>
          <h1 className="text-4xl font-bold tracking-tighter">CHAPTER</h1>
          <p className="text-zinc-500 text-sm mt-1">15 de Agosto · Acadêmicos da Asa Norte</p>
        </div>

        {/* Badge lote ativo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0f1f19] border border-[#1a2e26] px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 text-xs tracking-widest uppercase">
              Lote {lote.numero} — em andamento
            </span>
          </div>
        </div>

        {semVagas ? (
          <div className="border border-zinc-800 p-8 text-center">
            <p className="text-zinc-500 text-sm tracking-widest uppercase">
              Aguardando próximo lote...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Normal */}
            <div className="border border-zinc-900 bg-[#0a0f0d]">
              <div className="px-4 py-3 border-b border-zinc-900">
                <p className="text-xs tracking-widest uppercase text-zinc-500">Normal</p>
              </div>
              <div className="px-4">
                <LinhaIngresso
                  label="Masculino"
                  preco={lote.masc_normal_preco}
                  vagas={vagasMascNormal}
                  loteId={String(lote.id)}
                  categoria="masc_normal"
                />
                <LinhaIngresso
                  label="Feminino"
                  preco={lote.fem_normal_preco}
                  vagas={vagasFemNormal}
                  loteId={String(lote.id)}
                  categoria="fem_normal"
                />
              </div>
            </div>

            {/* VIP */}
            <div className="border border-[#a8ff78]/20 bg-[#0a0f0d]">
              <div className="px-4 py-3 border-b border-[#a8ff78]/20">
                <p className="text-xs tracking-widest uppercase text-[#a8ff78]">VIP</p>
              </div>
              <div className="px-4">
                <LinhaIngresso
                  label="Masculino"
                  preco={lote.masc_vip_preco}
                  vagas={vagasMascVip}
                  loteId={String(lote.id)}
                  categoria="masc_vip"
                  isVip
                />
                <LinhaIngresso
                  label="Feminino"
                  preco={lote.fem_vip_preco}
                  vagas={vagasFemVip}
                  loteId={String(lote.id)}
                  categoria="fem_vip"
                  isVip
                />
              </div>
            </div>
          </div>
        )}

        <p className="text-zinc-700 text-xs text-center tracking-wide">
          Open bar exclusivo · +18 · Documento obrigatório
        </p>
      </motion.div>
    </main>
  );
}
