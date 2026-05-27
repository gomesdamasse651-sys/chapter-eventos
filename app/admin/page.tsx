"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Ingresso = {
  id: string; nome: string; email: string; sexo: string; preco: number;
  status: string; seguro: boolean; qr_code: string | null; paid_at: string | null;
  lotes: { numero: number } | null; cupons: { codigo: string } | null;
};
type Cupom = { id: string; codigo: string; criado_por: string; usos: number; ativo: boolean };
type Lote = { numero: number; preco_f: number; preco_m: number; vendidos_f: number; vendidos_m: number; limite_f: number; limite_m: number; ativo: boolean };

export default function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [aba, setAba] = useState<"ingressos" | "cupons" | "lotes">("ingressos");
  const [novoCupom, setNovoCupom] = useState({ codigo: "", criado_por: "" });
  const [loadingExport, setLoadingExport] = useState(false);

  const carregarDados = useCallback(async () => {
    const [resI, resC, resL] = await Promise.all([
      fetch("/api/admin/ingressos"),
      fetch("/api/admin/cupons"),
      fetch("/api/admin/lotes"),
    ]);
    if (resI.ok) setIngressos((await resI.json()).ingressos ?? []);
    else if (resI.status === 401) { router.push("/admin/login"); return; }
    if (resC.ok) setCupons((await resC.json()).cupons ?? []);
    if (resL.ok) setLotes((await resL.json()).lotes ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  async function criarCupom(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/cupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoCupom),
    });
    setNovoCupom({ codigo: "", criado_por: "" });
    carregarDados();
  }

  async function toggleCupom(id: string, ativo: boolean) {
    await fetch("/api/admin/cupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    carregarDados();
  }

  async function exportarExcel() {
    setLoadingExport(true);
    const res = await fetch("/api/admin/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "chapter-ingressos.xlsx"; a.click();
    setLoadingExport(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-600 text-xs tracking-widest uppercase">Carregando...</p>
      </main>
    );
  }

  const totalPagos = ingressos.filter((i) => i.status === "pago").length;
  const totalF = ingressos.filter((i) => i.sexo === "F" && i.status === "pago").length;
  const totalM = ingressos.filter((i) => i.sexo === "M" && i.status === "pago").length;
  const receita = ingressos.filter((i) => i.status === "pago").reduce((acc, i) => acc + i.preco, 0);

  const abas = ["ingressos", "cupons", "lotes"] as const;

  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">
              CHAPTER <span className="text-zinc-600 text-lg font-normal">Admin</span>
            </h1>
            <p className="text-zinc-600 text-xs mt-1">Painel de controle</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportarExcel} disabled={loadingExport}
              className="px-4 py-2 border border-zinc-700 text-xs tracking-widest uppercase hover:border-white transition-all disabled:opacity-50">
              {loadingExport ? "..." : "Exportar Excel"}
            </button>
            <button onClick={logout}
              className="px-4 py-2 border border-zinc-800 text-xs tracking-widest uppercase text-zinc-500 hover:border-red-500 hover:text-red-400 transition-all">
              Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pagos", value: totalPagos },
            { label: "Feminino", value: totalF },
            { label: "Masculino", value: totalM },
            { label: "Receita", value: `R$ ${receita.toFixed(2).replace(".", ",")}` },
          ].map((s) => (
            <div key={s.label} className="border border-zinc-900 p-4 text-center">
              <p className="text-zinc-600 text-xs tracking-widest uppercase mb-1">{s.label}</p>
              <p className="text-2xl font-light">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-1 border-b border-zinc-900">
          {abas.map((a) => (
            <button key={a} onClick={() => setAba(a as typeof aba)}
              className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors ${aba === a ? "text-white border-b border-white" : "text-zinc-600 hover:text-zinc-400"}`}>
              {a}
            </button>
          ))}
        </div>

        {/* Ingressos */}
        {aba === "ingressos" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-600 text-xs tracking-widest uppercase border-b border-zinc-900">
                  <th className="text-left py-2 pr-4">Nome</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Sexo</th>
                  <th className="text-left py-2 pr-4">Lote</th>
                  <th className="text-left py-2 pr-4">Preço</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2">Seguro</th>
                </tr>
              </thead>
              <tbody>
                {ingressos.map((i) => (
                  <tr key={i.id} className="border-b border-zinc-900 hover:bg-zinc-950">
                    <td className="py-2 pr-4">{i.nome}</td>
                    <td className="py-2 pr-4 text-zinc-500 text-xs">{i.email}</td>
                    <td className="py-2 pr-4">{i.sexo}</td>
                    <td className="py-2 pr-4">{(i.lotes as unknown as { numero: number } | null)?.numero ?? "-"}</td>
                    <td className="py-2 pr-4">R$ {i.preco},00</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs ${i.status === "pago" ? "text-green-400" : i.status === "reembolsado" ? "text-yellow-400" : "text-zinc-500"}`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="py-2">{i.seguro ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ingressos.length === 0 && <p className="text-zinc-700 text-center py-8">Nenhum ingresso ainda.</p>}
          </div>
        )}

        {/* Cupons */}
        {aba === "cupons" && (
          <div className="flex flex-col gap-6">
            <form onSubmit={criarCupom} className="flex gap-3">
              <input type="text" required placeholder="CÓDIGO" value={novoCupom.codigo}
                onChange={(e) => setNovoCupom({ ...novoCupom, codigo: e.target.value.toUpperCase() })}
                className="bg-transparent border border-zinc-800 px-4 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 w-36"
              />
              <input type="text" required placeholder="Criado por" value={novoCupom.criado_por}
                onChange={(e) => setNovoCupom({ ...novoCupom, criado_por: e.target.value })}
                className="bg-transparent border border-zinc-800 px-4 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 flex-1"
              />
              <button type="submit" className="px-4 py-2 border border-white text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                Criar
              </button>
            </form>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-600 text-xs tracking-widest uppercase border-b border-zinc-900">
                  <th className="text-left py-2 pr-4">Código</th>
                  <th className="text-left py-2 pr-4">Criado por</th>
                  <th className="text-left py-2 pr-4">Usos</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {cupons.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-900">
                    <td className="py-2 pr-4 font-mono">{c.codigo}</td>
                    <td className="py-2 pr-4 text-zinc-500">{c.criado_por}</td>
                    <td className="py-2 pr-4">{c.usos}</td>
                    <td className="py-2">
                      <button onClick={() => toggleCupom(c.id, c.ativo)}
                        className={`text-xs px-2 py-1 border transition-all ${c.ativo ? "border-green-500 text-green-400 hover:bg-green-500 hover:text-black" : "border-zinc-700 text-zinc-500 hover:border-zinc-500"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lotes */}
        {aba === "lotes" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-600 text-xs tracking-widest uppercase border-b border-zinc-900">
                <th className="text-left py-2 pr-4">Lote</th>
                <th className="text-left py-2 pr-4">Preço F</th>
                <th className="text-left py-2 pr-4">Preço M</th>
                <th className="text-left py-2 pr-4">Vendidos F</th>
                <th className="text-left py-2 pr-4">Vendidos M</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr key={l.numero} className="border-b border-zinc-900">
                  <td className="py-2 pr-4">Lote {l.numero}</td>
                  <td className="py-2 pr-4">R$ {l.preco_f},00</td>
                  <td className="py-2 pr-4">R$ {l.preco_m},00</td>
                  <td className="py-2 pr-4">{l.vendidos_f}/{l.limite_f}</td>
                  <td className="py-2 pr-4">{l.vendidos_m}/{l.limite_m}</td>
                  <td className="py-2">
                    <span className={`text-xs ${l.ativo ? "text-green-400" : "text-zinc-600"}`}>
                      {l.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </main>
  );
}
