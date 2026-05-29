"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });

type Ingresso = {
  id: string; nome: string; email: string; sexo: string; preco: number;
  status: string; seguro: boolean; qr_code: string | null; paid_at: string | null;
  usado: boolean;
  lotes: { numero: number } | null; cupons: { codigo: string } | null;
};
type Cupom = { id: string; codigo: string; criado_por: string; usos: number; ativo: boolean; desconto: number };
type Lote = { numero: number; preco_f: number; preco_m: number; vendidos_f: number; vendidos_m: number; limite_f: number; limite_m: number; ativo: boolean };
type AdminUser = { id: string; nome: string; email: string; criado_em: string };

type Secao = "visao-geral" | "ingressos" | "cupons" | "admins" | "validador";

export default function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [secao, setSecao] = useState<Secao>("visao-geral");
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [novoCupom, setNovoCupom] = useState({ codigo: "", criado_por: "", desconto: 10 });
  const [novoAdmin, setNovoAdmin] = useState({ nome: "", email: "" });
  const [loadingExport, setLoadingExport] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroSexo, setFiltroSexo] = useState("");
  const [busca, setBusca] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [qrResultado, setQrResultado] = useState<{ valido?: boolean; usado?: boolean; ja_usado?: boolean; nome?: string; sexo?: string; lote?: number; erro?: string } | null>(null);
  const [qrValidando, setQrValidando] = useState(false);
  const [entradaLiberada, setEntradaLiberada] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);

  const carregarDados = useCallback(async () => {
    const [resI, resC, resL, resA] = await Promise.all([
      fetch("/api/admin/ingressos"),
      fetch("/api/admin/cupons"),
      fetch("/api/admin/lotes"),
      fetch("/api/admin/admin-users"),
    ]);
    if (resI.status === 401) { router.push("/login"); return; }
    if (resI.ok) setIngressos((await resI.json()).ingressos ?? []);
    if (resC.ok) setCupons((await resC.json()).cupons ?? []);
    if (resL.ok) setLotes((await resL.json()).lotes ?? []);
    if (resA.ok) setAdmins((await resA.json()).admins ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/");
  }

  async function criarCupom(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/cupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoCupom),
    });
    setNovoCupom({ codigo: "", criado_por: "", desconto: 10 });
    carregarDados();
  }

  async function toggleCupom(id: string, ativo: boolean) {
    await fetch("/api/admin/cupons", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    carregarDados();
  }

  async function criarAdmin(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/admin-users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoAdmin),
    });
    setNovoAdmin({ nome: "", email: "" });
    carregarDados();
  }

  async function removerAdmin(id: string) {
    if (!confirm("Remover este administrador?")) return;
    await fetch("/api/admin/admin-users", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
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

  function extrairUuid(valor: string): string {
    const v = valor.trim();
    if (v.includes("http")) {
      const segmentos = v.split("/").filter(Boolean);
      return segmentos[segmentos.length - 1] ?? v;
    }
    return v;
  }

  async function buscarQr(qr: string) {
    if (!qr.trim()) return;
    setQrValidando(true);
    setEntradaLiberada(false);
    const uuid = extrairUuid(qr);
    const res = await fetch(`/api/admin/validar?qr=${encodeURIComponent(uuid)}`);
    const data = await res.json();
    setQrResultado(data);
    setQrValidando(false);
  }

  async function validarEntrada() {
    if (!qrInput.trim()) return;
    setQrValidando(true);
    const uuid = extrairUuid(qrInput);
    const res = await fetch("/api/admin/validar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr: uuid }),
    });
    const data = await res.json();
    if (res.status === 409) {
      setQrResultado({ valido: false, ja_usado: true, nome: qrResultado?.nome, erro: "Ingresso já utilizado." });
      setQrValidando(false);
      return;
    }

    if (res.ok) {
      setEntradaLiberada(true);
    }
    setQrValidando(false);
  }

  // Stats
  const pagos = ingressos.filter((i) => i.status === "pago");
  const totalPagos = pagos.length;
  const totalF = pagos.filter((i) => i.sexo === "F").length;
  const totalM = pagos.filter((i) => i.sexo === "M").length;
  const receita = pagos.reduce((acc, i) => acc + i.preco, 0);
  const loteAtivo = lotes.find((l) => l.ativo);
  const vagasF = loteAtivo ? loteAtivo.limite_f - loteAtivo.vendidos_f : 0;
  const vagasM = loteAtivo ? loteAtivo.limite_m - loteAtivo.vendidos_m : 0;

  // Gráfico vendas por dia
  const vendasPorDia = pagos.reduce((acc: Record<string, number>, i) => {
    if (!i.paid_at) return acc;
    const dia = new Date(i.paid_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    acc[dia] = (acc[dia] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(vendasPorDia)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dia, vendas]) => ({ dia, vendas }));

  // Filtros de ingressos
  const ingressosFiltrados = ingressos.filter((i) => {
    if (filtroStatus && i.status !== filtroStatus) return false;
    if (filtroSexo && i.sexo !== filtroSexo) return false;
    if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase()) && !i.email.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const navItems: { id: Secao; label: string }[] = [
    { id: "visao-geral", label: "Visão Geral" },
    { id: "ingressos", label: "Ingressos" },
    { id: "cupons", label: "Cupons" },
    { id: "admins", label: "Administradores" },
    { id: "validador", label: "Validador" },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-600 text-xs tracking-widest uppercase">Carregando...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-52 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-transform duration-200 ${sidebarAberta ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex`}>
        <div className="px-6 py-6 border-b border-zinc-900">
          <p className="text-lg font-bold tracking-tighter">CHAPTER</p>
          <p className="text-zinc-600 text-xs tracking-widest uppercase">Admin</p>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setSecao(item.id); setSidebarAberta(false); }}
              className={`text-left px-3 py-2 text-xs tracking-widest uppercase transition-colors rounded ${secao === item.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"}`}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-900">
          <button onClick={logout}
            className="w-full text-left px-3 py-2 text-xs tracking-widest uppercase text-zinc-600 hover:text-red-400 transition-colors">
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarAberta(false)} />
      )}

      {/* Conteúdo */}
      <main className="flex-1 px-4 md:px-8 py-8 overflow-auto">
        {/* Header mobile */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <button onClick={() => setSidebarAberta(true)} className="text-zinc-500 text-xs tracking-widest uppercase border border-zinc-800 px-3 py-2">
            Menu
          </button>
          <p className="text-sm font-bold tracking-tighter">CHAPTER Admin</p>
        </div>

        {/* VISÃO GERAL */}
        {secao === "visao-geral" && (
          <div className="flex flex-col gap-8">
            <h2 className="text-xs tracking-widest uppercase text-zinc-500">Visão Geral</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Receita", value: `R$ ${receita.toFixed(2).replace(".", ",")}` },
                { label: "Ingressos", value: totalPagos },
                { label: "F / M", value: `${totalF} / ${totalM}` },
                { label: "Vagas F/M", value: `${vagasF} / ${vagasM}` },
              ].map((s) => (
                <div key={s.label} className="border border-zinc-900 p-4 text-center">
                  <p className="text-zinc-600 text-xs tracking-widest uppercase mb-1">{s.label}</p>
                  <p className="text-xl font-light">{s.value}</p>
                </div>
              ))}
            </div>

            {(totalF > 0 || totalM > 0) && (
              <div className="border border-zinc-900 p-6 flex flex-col md:flex-row items-center gap-6">
                <div>
                  <p className="text-xs tracking-widest uppercase text-zinc-500 mb-4">F vs M</p>
                  <PieChart width={140} height={140}>
                    <Pie data={[{ name: "F", value: totalF }, { name: "M", value: totalM }]} cx={65} cy={65} innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                      <Cell fill="#ffffff" />
                      <Cell fill="#3f3f46" />
                    </Pie>
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", color: "#fff", fontSize: 12 }} />
                  </PieChart>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-white shrink-0" />
                    <span className="text-sm text-zinc-300">Feminino</span>
                    <span className="ml-auto text-white font-medium">{totalF}</span>
                    <span className="text-zinc-600 text-xs">{totalPagos > 0 ? Math.round((totalF / totalPagos) * 100) : 0}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-zinc-600 shrink-0" />
                    <span className="text-sm text-zinc-300">Masculino</span>
                    <span className="ml-auto text-white font-medium">{totalM}</span>
                    <span className="text-zinc-600 text-xs">{totalPagos > 0 ? Math.round((totalM / totalPagos) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            )}

            {chartData.length > 0 && (
              <div className="border border-zinc-900 p-6">
                <p className="text-xs tracking-widest uppercase text-zinc-500 mb-4">Vendas por dia</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="dia" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", color: "#fff", fontSize: 12 }} />
                    <Line type="monotone" dataKey="vendas" stroke="#ffffff" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {loteAtivo && (
              <div className="border border-zinc-900 p-6">
                <p className="text-xs tracking-widest uppercase text-zinc-500 mb-4">Lote {loteAtivo.numero} — progresso</p>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Feminino", vendidos: loteAtivo.vendidos_f, limite: loteAtivo.limite_f },
                    { label: "Masculino", vendidos: loteAtivo.vendidos_m, limite: loteAtivo.limite_m },
                  ].map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>{p.label}</span>
                        <span>{p.vendidos}/{p.limite}</span>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded">
                        <div className="h-1 bg-white rounded transition-all"
                          style={{ width: `${Math.min(100, (p.vendidos / p.limite) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INGRESSOS */}
        {secao === "ingressos" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <h2 className="text-xs tracking-widest uppercase text-zinc-500">Ingressos ({ingressosFiltrados.length})</h2>
              <button onClick={exportarExcel} disabled={loadingExport}
                className="px-4 py-2 border border-zinc-700 text-xs tracking-widest uppercase hover:border-white transition-all disabled:opacity-50">
                {loadingExport ? "..." : "Exportar Excel"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <input type="text" placeholder="Buscar nome ou email" value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="bg-transparent border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 flex-1 min-w-40"
              />
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-black border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">Todos status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
              <select value={filtroSexo} onChange={(e) => setFiltroSexo(e.target.value)}
                className="bg-black border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">Todos</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-600 text-xs tracking-widest uppercase border-b border-zinc-900">
                    <th className="text-left py-2 pr-3">Nome</th>
                    <th className="text-left py-2 pr-3">Email</th>
                    <th className="text-left py-2 pr-3">Sexo</th>
                    <th className="text-left py-2 pr-3">Lote</th>
                    <th className="text-left py-2 pr-3">Preço</th>
                    <th className="text-left py-2 pr-3">Cupom</th>
                    <th className="text-left py-2 pr-3">Seg.</th>
                    <th className="text-left py-2 pr-3">Status</th>
                    <th className="text-left py-2 pr-3">Data</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ingressosFiltrados.map((i) => (
                    <tr key={i.id} className="border-b border-zinc-900 hover:bg-zinc-950">
                      <td className="py-2 pr-3">{i.nome}</td>
                      <td className="py-2 pr-3 text-zinc-500 text-xs">{i.email}</td>
                      <td className="py-2 pr-3">{i.sexo}</td>
                      <td className="py-2 pr-3">{(i.lotes as unknown as { numero: number } | null)?.numero ?? "-"}</td>
                      <td className="py-2 pr-3">R${i.preco}</td>
                      <td className="py-2 pr-3 text-zinc-500 text-xs">{(i.cupons as unknown as { codigo: string } | null)?.codigo ?? "-"}</td>
                      <td className="py-2 pr-3">{i.seguro ? "✓" : "—"}</td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs ${i.status === "pago" ? "text-green-400" : i.status === "reembolsado" ? "text-yellow-400" : "text-zinc-500"}`}>
                          {i.usado ? "usado" : i.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-zinc-600 text-xs">
                        {i.paid_at ? new Date(i.paid_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={async () => {
                            if (!confirm("Tem certeza que deseja remover este ingresso?")) return;
                            await fetch(`/api/admin/ingressos?id=${i.id}`, { method: "DELETE" });
                            setIngressos((prev) => prev.filter((x) => x.id !== i.id));
                          }}
                          className="text-xs px-2 py-1 transition-colors hover:opacity-100"
                          style={{ color: "rgba(255,0,0,0.7)" }}
                          title="Remover ingresso"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ingressosFiltrados.length === 0 && <p className="text-zinc-700 text-center py-8">Nenhum resultado.</p>}
            </div>
          </div>
        )}

        {/* CUPONS */}
        {secao === "cupons" && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xs tracking-widest uppercase text-zinc-500">Cupons</h2>
            <form onSubmit={criarCupom} className="flex gap-3 flex-wrap">
              <input type="text" required placeholder="CÓDIGO" value={novoCupom.codigo}
                onChange={(e) => setNovoCupom({ ...novoCupom, codigo: e.target.value.toUpperCase() })}
                className="bg-transparent border border-zinc-800 px-4 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 w-36"
              />
              <input type="text" required placeholder="Criado por" value={novoCupom.criado_por}
                onChange={(e) => setNovoCupom({ ...novoCupom, criado_por: e.target.value })}
                className="bg-transparent border border-zinc-800 px-4 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 flex-1 min-w-40"
              />
              <div className="flex items-center border border-zinc-800 px-4 py-2 gap-2 w-28">
                <input type="number" required min={1} max={100} value={novoCupom.desconto}
                  onChange={(e) => setNovoCupom({ ...novoCupom, desconto: Number(e.target.value) })}
                  className="bg-transparent text-white text-sm focus:outline-none w-full"
                />
                <span className="text-zinc-500 text-sm">%</span>
              </div>
              <button type="submit" className="px-4 py-2 border border-white text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                Criar
              </button>
            </form>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-600 text-xs tracking-widest uppercase border-b border-zinc-900">
                  <th className="text-left py-2 pr-4">Código</th>
                  <th className="text-left py-2 pr-4">Criado por</th>
                  <th className="text-left py-2 pr-4">Desconto</th>
                  <th className="text-left py-2 pr-4">Usos</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {cupons.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-900">
                    <td className="py-2 pr-4 font-mono">{c.codigo}</td>
                    <td className="py-2 pr-4 text-zinc-500">{c.criado_por}</td>
                    <td className="py-2 pr-4 text-zinc-300">{c.desconto ?? 10}%</td>
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

        {/* ADMINISTRADORES */}
        {secao === "admins" && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xs tracking-widest uppercase text-zinc-500">Administradores</h2>
            <form onSubmit={criarAdmin} className="flex gap-3 flex-wrap">
              <input type="text" required placeholder="Nome" value={novoAdmin.nome}
                onChange={(e) => setNovoAdmin({ ...novoAdmin, nome: e.target.value })}
                className="bg-transparent border border-zinc-800 px-4 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 flex-1 min-w-40"
              />
              <input type="email" required placeholder="Email" value={novoAdmin.email}
                onChange={(e) => setNovoAdmin({ ...novoAdmin, email: e.target.value })}
                className="bg-transparent border border-zinc-800 px-4 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 flex-1 min-w-40"
              />
              <button type="submit" className="px-4 py-2 border border-white text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                Adicionar
              </button>
            </form>
            <p className="text-zinc-600 text-xs">Todos os administradores usam a mesma senha de acesso configurada no sistema.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-600 text-xs tracking-widest uppercase border-b border-zinc-900">
                  <th className="text-left py-2 pr-4">Nome</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Adicionado em</th>
                  <th className="text-left py-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-900">
                    <td className="py-2 pr-4">{a.nome}</td>
                    <td className="py-2 pr-4 text-zinc-500 text-xs">{a.email}</td>
                    <td className="py-2 pr-4 text-zinc-600 text-xs">{new Date(a.criado_em).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">
                      <button onClick={() => removerAdmin(a.id)}
                        className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VALIDADOR */}
        {secao === "validador" && (
          <div className="flex flex-col gap-6 max-w-md">
            <h2 className="text-xs tracking-widest uppercase text-zinc-500">Validador de Entrada</h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite ou escaneie o QR code"
                value={qrInput}
                onChange={(e) => { setQrInput(e.target.value); setQrResultado(null); setEntradaLiberada(false); }}
                onKeyDown={(e) => e.key === "Enter" && buscarQr(qrInput)}
                className="flex-1 bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 font-mono text-sm"
                autoFocus
              />
              <button onClick={() => buscarQr(qrInput)} disabled={qrValidando}
                className="px-4 py-3 border border-zinc-700 text-xs tracking-widest uppercase hover:border-white transition-all disabled:opacity-50">
                {qrValidando ? "..." : "Verificar"}
              </button>
            </div>

            <QrScanner onScan={(valor) => {
              const uuid = extrairUuid(valor);
              setQrInput(uuid);
              setQrResultado(null);
              buscarQr(uuid);
            }} />

            {qrResultado && (
              <div className={`border p-6 flex flex-col gap-4 ${
                entradaLiberada ? "border-green-600" :
                qrResultado.ja_usado ? "border-red-800" :
                qrResultado.valido ? "border-green-700" : "border-red-800"
              }`}>
                {entradaLiberada ? (
                  <div className="text-center flex flex-col gap-4">
                    <div>
                      <p className="text-green-400 text-2xl font-bold">✓ ENTRADA LIBERADA</p>
                      <p className="text-white text-lg mt-2">{qrResultado.nome}</p>
                      <p className="text-zinc-500 text-sm">{qrResultado.sexo === "F" ? "Feminino" : "Masculino"} · Lote {qrResultado.lote}</p>
                    </div>
                    <button onClick={() => { setEntradaLiberada(false); setQrResultado(null); setQrInput(""); }}
                      className="py-2 border border-zinc-700 text-xs tracking-widest uppercase text-zinc-400 hover:border-zinc-500 transition-all">
                      Novo Scan
                    </button>
                  </div>
                ) : qrResultado.ja_usado ? (
                  <div className="text-center">
                    <p className="text-red-400 text-2xl font-bold">✗ INGRESSO JÁ UTILIZADO</p>
                    <p className="text-white mt-3">{qrResultado.nome}</p>
                    <p className="text-zinc-500 text-sm mt-1">{qrResultado.sexo === "F" ? "Feminino" : "Masculino"} · Lote {qrResultado.lote}</p>
                  </div>
                ) : qrResultado.valido ? (
                  <>
                    <div className="text-center">
                      <p className="text-green-400 text-2xl font-bold">✓ VÁLIDO</p>
                      <p className="text-white text-lg mt-2">{qrResultado.nome}</p>
                      <p className="text-zinc-500 text-sm">{qrResultado.sexo === "F" ? "Feminino" : "Masculino"} · Lote {qrResultado.lote}</p>
                    </div>
                    <button onClick={validarEntrada} disabled={qrValidando}
                      className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-50">
                      {qrValidando ? "Validando..." : "VALIDAR ENTRADA"}
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-red-400 text-2xl font-bold">✗ INVÁLIDO</p>
                    <p className="text-zinc-500 text-sm mt-2">{qrResultado.erro}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
