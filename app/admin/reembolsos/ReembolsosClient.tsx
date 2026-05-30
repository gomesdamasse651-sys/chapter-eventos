"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type IngressoReembolso = {
  id: string;
  nome: string;
  email: string;
  categoria: string;
  preco: number;
  reembolso_chave_pix: string | null;
  reembolso_solicitado_em: string | null;
  reembolso_pago: boolean;
  reembolso_pago_em: string | null;
  status: string;
  lotes: { numero: number } | null;
};

type Props = {
  pendentes: IngressoReembolso[];
  processados: IngressoReembolso[];
};

function categoriaLabel(cat: string): string {
  const map: Record<string, string> = {
    masc_normal: "Masc Normal",
    fem_normal: "Fem Normal",
    masc_vip: "Masc VIP",
    fem_vip: "Fem VIP",
  };
  return map[cat] ?? cat;
}

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const BG = "#0a0f0d";
const CARD = "#111815";
const BORDER = "rgba(255,255,255,0.06)";

export default function ReembolsosClient({ pendentes, processados }: Props) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);

  const pendentesFiltrados = pendentes.filter(
    (r) =>
      !busca ||
      r.nome.toLowerCase().includes(busca.toLowerCase()) ||
      r.email.toLowerCase().includes(busca.toLowerCase())
  );

  async function marcarReembolsado(r: IngressoReembolso) {
    if (!window.confirm(`Confirmar reembolso e cancelar ingresso de ${r.nome}?`)) return;
    setProcessando(r.id);
    const res = await fetch("/api/admin/reembolsos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingresso_id: r.id }),
    });
    setProcessando(null);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json() as { error?: string };
      alert(d.error ?? "Erro ao processar reembolso.");
    }
  }

  return (
    <main className="min-h-screen text-white px-4 md:px-8 py-10 flex flex-col gap-6" style={{ background: BG }}>
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase">
        <Link href="/admin" className="text-zinc-600 hover:text-zinc-300 transition-colors">Admin</Link>
        <span className="text-zinc-800">›</span>
        <span style={{ color: "#c9a96e" }}>Reembolsos</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-medium">Reembolsos</h1>
        <span className="text-xs text-zinc-500">{pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar por nome ou email..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="bg-transparent border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors max-w-sm"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      />

      {/* Pendentes */}
      <section className="flex flex-col gap-3">
        <p className="text-[11px] tracking-[0.15em] uppercase text-zinc-500">Aguardando processamento</p>

        {pendentesFiltrados.length === 0 ? (
          <div className="p-8 text-center border" style={{ border: `0.5px solid ${BORDER}` }}>
            <p className="text-zinc-600 text-sm">{busca ? "Nenhum resultado." : "Nenhum reembolso pendente."}</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: `0.5px solid ${BORDER}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] tracking-widest uppercase text-zinc-500 border-b" style={{ background: CARD, borderColor: BORDER }}>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Valor</th>
                  <th className="text-left px-4 py-3">Chave Pix</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Solicitado em</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pendentesFiltrados.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-0"
                    style={{ background: i % 2 === 0 ? BG : CARD, borderColor: BORDER }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white text-[13px]">{r.nome}</p>
                      <p className="text-zinc-500 text-[11px]">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-400 text-[12px]">
                      {categoriaLabel(r.categoria)}
                      {r.lotes ? ` · Lote ${(r.lotes as { numero: number }).numero}` : ""}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-300 text-[12px]">
                      R$ {r.preco.toFixed(0)},00
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[12px] text-white">{r.reembolso_chave_pix ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-zinc-500 text-[11px]">
                      {r.reembolso_solicitado_em ? formatData(r.reembolso_solicitado_em) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => marcarReembolsado(r)}
                        disabled={processando === r.id}
                        className="text-[11px] tracking-widest uppercase px-3 py-1.5 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/30 transition-colors disabled:opacity-40"
                      >
                        {processando === r.id ? "..." : "Reembolsar e cancelar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Processados */}
      {processados.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-[11px] tracking-[0.15em] uppercase text-zinc-500">Já processados</p>
          <div className="rounded-xl overflow-hidden" style={{ border: `0.5px solid ${BORDER}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] tracking-widest uppercase text-zinc-500 border-b" style={{ background: CARD, borderColor: BORDER }}>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Valor</th>
                  <th className="text-left px-4 py-3">Chave Pix</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Reembolsado em</th>
                </tr>
              </thead>
              <tbody>
                {processados.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-0"
                    style={{ background: i % 2 === 0 ? BG : CARD, borderColor: BORDER }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-zinc-400 text-[13px]">{r.nome}</p>
                      <p className="text-zinc-600 text-[11px]">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-600 text-[12px]">
                      {categoriaLabel(r.categoria)}
                      {r.lotes ? ` · Lote ${(r.lotes as { numero: number }).numero}` : ""}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-600 text-[12px]">
                      R$ {r.preco.toFixed(0)},00
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[12px] text-zinc-500">{r.reembolso_chave_pix ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-zinc-600 text-[11px]">
                      {r.reembolso_pago_em ? formatData(r.reembolso_pago_em) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
