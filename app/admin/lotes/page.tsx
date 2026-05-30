import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLotesAdmin } from "@/lib/lotes";
import type { Lote } from "@/lib/lotes";
import LoteBotoes from "./LoteBotoes";

function faturamentoLote(lote: Lote): number {
  return (
    lote.masc_normal_vendidos * lote.masc_normal_preco +
    lote.fem_normal_vendidos * lote.fem_normal_preco +
    lote.masc_vip_vendidos * lote.masc_vip_preco +
    lote.fem_vip_vendidos * lote.fem_vip_preco
  );
}

function previsaoLote(lote: Lote): number {
  return (
    lote.masc_normal_total * lote.masc_normal_preco +
    lote.fem_normal_total * lote.fem_normal_preco +
    lote.masc_vip_total * lote.masc_vip_preco +
    lote.fem_vip_total * lote.fem_vip_preco
  );
}

function totalVendidosLote(lote: Lote): number {
  return (
    lote.masc_normal_vendidos +
    lote.fem_normal_vendidos +
    lote.masc_vip_vendidos +
    lote.fem_vip_vendidos
  );
}

function totalCapacidadeLote(lote: Lote): number {
  return (
    lote.masc_normal_total +
    lote.fem_normal_total +
    lote.masc_vip_total +
    lote.fem_vip_total
  );
}

const PROJECAO_TOTAL = 21450;
const CAPACIDADE_TOTAL = 300;

const statusLabel: Record<string, string> = {
  ativo: "Ativo",
  fechado: "Fechado",
  esgotado: "Esgotado",
};

const statusColor: Record<string, string> = {
  ativo: "text-green-400 border-green-700",
  fechado: "text-zinc-500 border-zinc-700",
  esgotado: "text-red-400 border-red-800",
};

export default async function AdminLotesPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");
  if (auth?.value !== "true") redirect("/admin/login");

  const lotes = await getLotesAdmin();

  const totalVendidos = lotes.reduce((acc, l) => acc + totalVendidosLote(l), 0);
  const faturamento = lotes.reduce((acc, l) => acc + faturamentoLote(l), 0);
  const ocupacaoPct = Math.round((totalVendidos / CAPACIDADE_TOTAL) * 100);

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-10 flex flex-col gap-8 max-w-5xl mx-auto">
      <div>
        <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-1">Admin</p>
        <h1 className="text-3xl font-bold tracking-tighter">Gestão de Lotes</h1>
      </div>

      {/* 4 Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Vendidos", value: String(totalVendidos) },
          { label: "Capacidade", value: String(CAPACIDADE_TOTAL) },
          { label: "Faturamento", value: `R$ ${faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
          { label: "Projeção Total", value: `R$ ${PROJECAO_TOTAL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
        ].map((card) => (
          <div key={card.label} className="border border-zinc-900 p-4 text-center">
            <p className="text-zinc-600 text-xs tracking-widest uppercase mb-1">{card.label}</p>
            <p className="text-xl font-light">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de ocupação geral */}
      <div className="border border-zinc-900 p-5 flex flex-col gap-3">
        <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-widest">
          <span>Ocupação geral</span>
          <span>{totalVendidos}/{CAPACIDADE_TOTAL} — {ocupacaoPct}%</span>
        </div>
        <div className="h-2 bg-zinc-900 rounded">
          <div
            className="h-2 bg-white rounded transition-all"
            style={{ width: `${Math.min(100, ocupacaoPct)}%` }}
          />
        </div>
      </div>

      {/* Cards de lotes */}
      <div className="flex flex-col gap-6">
        {lotes.map((lote) => {
          const vendidos = totalVendidosLote(lote);
          const capacidade = totalCapacidadeLote(lote);
          const fat = faturamentoLote(lote);
          const prev = previsaoLote(lote);
          const pct = capacidade > 0 ? Math.round((vendidos / capacidade) * 100) : 0;

          const categorias = [
            {
              label: "Masc Normal",
              vendidos: lote.masc_normal_vendidos,
              total: lote.masc_normal_total,
              preco: lote.masc_normal_preco,
            },
            {
              label: "Fem Normal",
              vendidos: lote.fem_normal_vendidos,
              total: lote.fem_normal_total,
              preco: lote.fem_normal_preco,
            },
            {
              label: "Masc VIP",
              vendidos: lote.masc_vip_vendidos,
              total: lote.masc_vip_total,
              preco: lote.masc_vip_preco,
            },
            {
              label: "Fem VIP",
              vendidos: lote.fem_vip_vendidos,
              total: lote.fem_vip_total,
              preco: lote.fem_vip_preco,
            },
          ];

          return (
            <div key={lote.id} className="border border-zinc-900 p-5 flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-light tracking-tight">{lote.nome}</h2>
                  <span
                    className={`text-xs tracking-widest uppercase border px-2 py-0.5 ${statusColor[lote.status] ?? "text-zinc-500 border-zinc-700"}`}
                  >
                    {statusLabel[lote.status] ?? lote.status}
                  </span>
                  {lote.forcado_admin && (
                    <span className="text-xs tracking-widest text-yellow-600 border border-yellow-900 px-2 py-0.5">
                      Manual
                    </span>
                  )}
                </div>
                <LoteBotoes loteId={lote.id} status={lote.status} />
              </div>

              {/* Grid categorias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna esquerda: vendidos */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs tracking-widest uppercase text-zinc-600 mb-1">Vendidos / Total</p>
                  {categorias.map((cat) => (
                    <div key={cat.label} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{cat.label}</span>
                      <span className="text-white font-light">
                        {cat.vendidos}/{cat.total}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Coluna direita: faturamento por categoria */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs tracking-widest uppercase text-zinc-600 mb-1">Faturamento</p>
                  {categorias.map((cat) => (
                    <div key={cat.label} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{cat.label}</span>
                      <span className="text-white font-light">
                        R$ {(cat.vendidos * cat.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>{vendidos}/{capacidade} ingressos</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1 bg-zinc-900 rounded">
                  <div
                    className="h-1 bg-white rounded transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Total faturado vs previsão */}
              <div className="flex justify-between text-sm border-t border-zinc-900 pt-3">
                <span className="text-zinc-500">Faturado neste lote</span>
                <span className="text-white font-light">
                  R$ {fat.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  <span className="text-zinc-600 font-light">
                    {" "}/ R$ {prev.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total geral */}
      <div className="border border-zinc-800 p-5 flex justify-between items-center">
        <span className="text-xs tracking-widest uppercase text-zinc-500">Total geral previsto</span>
        <span className="text-2xl font-light">
          R$ {PROJECAO_TOTAL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </main>
  );
}
