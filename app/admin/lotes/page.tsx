import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLotesAdmin, getLoteAtivo } from "@/lib/lotes";
import type { Lote } from "@/lib/lotes";
import LoteBotoes from "./LoteBotoes";
import Link from "next/link";

// ── helpers ────────────────────────────────────────────────────────────────

function faturamentoLote(l: Lote): number {
  return (
    l.masc_normal_vendidos * l.masc_normal_preco +
    l.fem_normal_vendidos  * l.fem_normal_preco  +
    l.masc_vip_vendidos    * l.masc_vip_preco    +
    l.fem_vip_vendidos     * l.fem_vip_preco
  );
}

function previsaoLote(l: Lote): number {
  return (
    l.masc_normal_total * l.masc_normal_preco +
    l.fem_normal_total  * l.fem_normal_preco  +
    l.masc_vip_total    * l.masc_vip_preco    +
    l.fem_vip_total     * l.fem_vip_preco
  );
}

function totalVendidosLote(l: Lote): number {
  return l.masc_normal_vendidos + l.fem_normal_vendidos + l.masc_vip_vendidos + l.fem_vip_vendidos;
}

function totalCapacidadeLote(l: Lote): number {
  return l.masc_normal_total + l.fem_normal_total + l.masc_vip_total + l.fem_vip_total;
}

function brl(n: number): string {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ordinal(n: number): string {
  return `${n}°`;
}

function progressColor(pct: number): string {
  if (pct >= 90) return "#E24B4A";
  if (pct >= 60) return "#BA7517";
  return "#639922";
}

// ── badge ──────────────────────────────────────────────────────────────────

function Badge({ status, forcado }: { status: string; forcado: boolean }) {
  if (status === "ativo") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
        style={{ background: "#EAF3DE", color: "#27500A" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "currentColor" }}
        />
        {forcado ? "ativo (forçado)" : "em andamento"}
      </span>
    );
  }
  if (status === "esgotado") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
        style={{ background: "#FCEBEB", color: "#791F1F" }}
      >
        esgotado
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full"
      style={{ background: "#1c1c1c", color: "#888" }}
    >
      {forcado ? "fechado (forçado)" : "fechado"}
    </span>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

export const revalidate = 0;

export default async function AdminLotesPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");
  if (auth?.value !== "true") redirect("/admin/login");

  const [lotes, loteAtivo] = await Promise.all([getLotesAdmin(), getLoteAtivo()]);

  const totalVendidos   = lotes.reduce((a, l) => a + totalVendidosLote(l), 0);
  const totalCapacidade = lotes.reduce((a, l) => a + totalCapacidadeLote(l), 0);
  const faturamentoReal = lotes.reduce((a, l) => a + faturamentoLote(l), 0);
  const projecaoTotal   = lotes.reduce((a, l) => a + previsaoLote(l), 0);
  const ocupacaoPct     = totalCapacidade > 0 ? (totalVendidos / totalCapacidade) * 100 : 0;

  // vagas do lote ativo para a vista do cliente
  const vagasAtivo = loteAtivo
    ? (loteAtivo.masc_normal_total - loteAtivo.masc_normal_vendidos)
      + (loteAtivo.fem_normal_total - loteAtivo.fem_normal_vendidos)
      + (loteAtivo.masc_vip_total - loteAtivo.masc_vip_vendidos)
      + (loteAtivo.fem_vip_total - loteAtivo.fem_vip_vendidos)
    : 0;
  const capacidadeAtivo = loteAtivo ? totalCapacidadeLote(loteAtivo) : 0;

  const BG = "#0a0f0d";
  const CARD = "#111815";
  const BORDER = "rgba(255,255,255,0.06)";
  const METRIC_BG = "#161e19";
  const GOLD = "#c9a96e";
  const GREEN_BTN = "#1a2e26";

  return (
    <main
      className="min-h-screen text-white px-4 md:px-8 py-10 flex flex-col gap-6 max-w-4xl mx-auto"
      style={{ background: BG }}
    >
      {/* ── breadcrumb ── */}
      <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase">
        <a href="/admin" className="text-zinc-600 hover:text-zinc-300 transition-colors">Admin</a>
        <span className="text-zinc-800">›</span>
        <span style={{ color: GOLD }}>Lotes</span>
      </div>

      {/* ══════════════════════════════════════════════
          VISTA DO CLIENTE
      ══════════════════════════════════════════════ */}
      <p className="text-[11px] tracking-[0.15em] uppercase text-zinc-500">
        Vista do cliente — lote ativo
      </p>

      {loteAtivo ? (
        <div
          className="rounded-xl p-5 flex flex-col gap-5"
          style={{ background: CARD, border: `0.5px solid ${BORDER}` }}
        >
          {/* header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Badge status={loteAtivo.status} forcado={loteAtivo.forcado_admin} />
              <p className="text-[12px] text-zinc-500 mt-1">
                Próximo lote mais caro. Garante agora.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] text-zinc-500">Vagas neste lote</p>
              <p className="text-[20px] font-medium text-white leading-tight">
                {vagasAtivo}{" "}
                <span className="text-[13px] text-zinc-500 font-normal">/ {capacidadeAtivo}</span>
              </p>
            </div>
          </div>

          {/* Normal */}
          <div>
            <p className="text-[12px] text-zinc-500 mb-2">Normal</p>
            {[
              {
                label: "Masculino",
                vagas: loteAtivo.masc_normal_total - loteAtivo.masc_normal_vendidos,
                preco: loteAtivo.masc_normal_preco,
              },
              {
                label: "Feminino",
                vagas: loteAtivo.fem_normal_total - loteAtivo.fem_normal_vendidos,
                preco: loteAtivo.fem_normal_preco,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: `0.5px solid ${BORDER}` }}
              >
                <div>
                  <p className="text-[13px] text-white">{row.label}</p>
                  <p className="text-[12px] text-zinc-500">{row.vagas} vaga{row.vagas !== 1 ? "s" : ""} restante{row.vagas !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-[14px] font-medium text-white">{brl(row.preco)}</p>
              </div>
            ))}
          </div>

          {/* VIP */}
          <div>
            <p className="text-[12px] text-zinc-500 mb-2 flex items-center gap-2">
              Área VIP{" "}
              <span
                className="text-[11px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: "#FAEEDA", color: "#633806" }}
              >
                VIP
              </span>
            </p>
            {[
              {
                label: "Masculino VIP",
                vagas: loteAtivo.masc_vip_total - loteAtivo.masc_vip_vendidos,
                preco: loteAtivo.masc_vip_preco,
              },
              {
                label: "Feminino VIP",
                vagas: loteAtivo.fem_vip_total - loteAtivo.fem_vip_vendidos,
                preco: loteAtivo.fem_vip_preco,
              },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2"
                style={i < arr.length - 1 ? { borderBottom: `0.5px solid ${BORDER}` } : {}}
              >
                <div>
                  <p className="text-[13px] text-white">{row.label}</p>
                  <p className="text-[12px] text-zinc-500">{row.vagas} vaga{row.vagas !== 1 ? "s" : ""} restante{row.vagas !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-[14px] font-medium text-white">{brl(row.preco)}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/comprar"
            className="w-full py-3 text-center text-[14px] text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ background: GREEN_BTN }}
          >
            Comprar ingresso
          </Link>
          <p className="text-[11px] text-zinc-600 text-center -mt-3">
            Open bar exclusivo +18 · Documento obrigatório
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl p-5 text-center text-zinc-500 text-sm"
          style={{ background: CARD, border: `0.5px solid ${BORDER}` }}
        >
          Nenhum lote ativo no momento.
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PAINEL ADMIN
      ══════════════════════════════════════════════ */}
      <div
        className="w-full"
        style={{ height: "0.5px", background: BORDER, margin: "4px 0" }}
      />
      <p className="text-[11px] tracking-[0.15em] uppercase text-zinc-500">
        Painel admin — visão completa
      </p>

      {/* 4 métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Vendidos",      val: String(totalVendidos) },
          { label: "Capacidade",    val: String(totalCapacidade) },
          { label: "Faturado",      val: brl(faturamentoReal) },
          { label: "Projeção total", val: brl(projecaoTotal) },
        ].map((m) => (
          <div key={m.label} className="rounded-lg p-4" style={{ background: METRIC_BG }}>
            <p className="text-[12px] text-zinc-500 mb-1">{m.label}</p>
            <p className="text-[22px] font-medium text-white">{m.val}</p>
          </div>
        ))}
      </div>

      {/* Barra ocupação geral */}
      <div
        className="rounded-xl p-5"
        style={{ background: CARD, border: `0.5px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-3">
          <p className="text-[13px] text-zinc-500 w-32 flex-shrink-0">Ocupação geral</p>
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: 8, background: METRIC_BG }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ocupacaoPct)}%`,
                background: progressColor(ocupacaoPct),
              }}
            />
          </div>
          <span className="text-[13px] font-medium text-white flex-shrink-0">
            {totalVendidos} / {totalCapacidade}
          </span>
        </div>
      </div>

      {/* Cards de lotes */}
      <div className="flex flex-col gap-2.5">
        {lotes.map((lote, idx) => {
          const vendidos   = totalVendidosLote(lote);
          const capacidade = totalCapacidadeLote(lote);
          const fat        = faturamentoLote(lote);
          const prev       = previsaoLote(lote);
          const pct        = capacidade > 0 ? (vendidos / capacidade) * 100 : 0;
          const isAtivo    = lote.status === "ativo";
          const isUltimo   = idx === lotes.length - 1;

          const cats = [
            { label: "Masc normal", v: lote.masc_normal_vendidos, t: lote.masc_normal_total, p: lote.masc_normal_preco },
            { label: "Fem normal",  v: lote.fem_normal_vendidos,  t: lote.fem_normal_total,  p: lote.fem_normal_preco  },
            { label: "Masc VIP",    v: lote.masc_vip_vendidos,    t: lote.masc_vip_total,    p: lote.masc_vip_preco    },
            { label: "Fem VIP",     v: lote.fem_vip_vendidos,     t: lote.fem_vip_total,     p: lote.fem_vip_preco     },
          ];

          return (
            <div
              key={lote.id}
              className="rounded-xl p-5 flex flex-col gap-4"
              style={{
                background: CARD,
                border: isAtivo ? "1px solid #639922" : `0.5px solid ${BORDER}`,
              }}
            >
              {/* header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] font-medium text-white">
                    {ordinal(lote.numero)} Lote{isUltimo ? " — último" : ""}
                  </span>
                  <Badge status={lote.status} forcado={lote.forcado_admin} />
                </div>
                <LoteBotoes loteId={lote.id} status={lote.status} />
              </div>

              {/* lote ativo: grid com vendidos + faturamento por categoria */}
              {isAtivo ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* col vendidos */}
                    <div className="flex flex-col gap-0.5">
                      {cats.map((c) => (
                        <div
                          key={c.label}
                          className="flex justify-between text-[13px] py-1"
                          style={{ color: "#888" }}
                        >
                          <span>{c.label}</span>
                          <span>
                            <strong className="text-white font-medium">{c.v}</strong>/{c.t}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* col faturamento */}
                    <div className="flex flex-col gap-0.5">
                      {cats.map((c) => (
                        <div
                          key={c.label}
                          className="flex justify-between text-[13px] py-1"
                          style={{ color: "#888" }}
                        >
                          <span>{c.label}</span>
                          <strong className="text-white font-medium">{brl(c.v * c.p)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* barra progresso */}
                  <div
                    className="rounded-full overflow-hidden"
                    style={{ height: 4, background: METRIC_BG }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        background: progressColor(pct),
                      }}
                    />
                  </div>

                  {/* faturado / previsão */}
                  <div
                    className="flex justify-between items-center rounded-lg px-3 py-3"
                    style={{ background: METRIC_BG }}
                  >
                    <span className="text-[13px] text-zinc-500">Faturado neste lote</span>
                    <span className="text-[13px] font-medium text-white">
                      {brl(fat)}{" "}
                      <span className="text-zinc-500 font-normal">/ {brl(prev)}</span>
                    </span>
                  </div>
                </>
              ) : (
                /* lote fechado/esgotado: resumo compacto */
                <>
                  <div
                    className="flex justify-between text-[13px] py-1"
                    style={{ color: "#888" }}
                  >
                    <span>Previsão de faturamento</span>
                    <strong className="text-white font-medium">{brl(prev)}</strong>
                  </div>
                  <div
                    className="flex justify-between text-[13px] py-1"
                    style={{ color: "#888" }}
                  >
                    <span>Vagas</span>
                    <strong className="text-white font-medium">
                      {capacidade} ({lote.masc_normal_total}M + {lote.fem_normal_total}F + {lote.masc_vip_total} VIP M + {lote.fem_vip_total} VIP F)
                    </strong>
                  </div>
                  {vendidos > 0 && (
                    <div
                      className="flex justify-between text-[13px] py-1"
                      style={{ color: "#888" }}
                    >
                      <span>Já vendidos</span>
                      <strong className="text-white font-medium">{vendidos} ({brl(fat)})</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: faturamento máximo total */}
      <div
        className="flex justify-between items-center rounded-lg px-4 py-3"
        style={{ background: METRIC_BG }}
      >
        <span className="text-[14px] text-zinc-500">Faturamento máximo total</span>
        <span className="text-[18px] font-medium text-white">{brl(projecaoTotal)}</span>
      </div>
    </main>
  );
}
