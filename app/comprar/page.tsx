"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Lote = {
  id: number;
  numero: number;
  preco_f: number;
  preco_m: number;
  preco_vip_f: number;
  preco_vip_m: number;
  vendidos_f: number;
  vendidos_m: number;
  vendidos_vip_f: number;
  vendidos_vip_m: number;
  limite_f: number;
  limite_m: number;
  limite_vip_f: number;
  limite_vip_m: number;
  ativo: boolean;
};

export default function Comprar() {
  const [lote, setLote] = useState<Lote | null>(null);
  const [sexo, setSexo] = useState<"F" | "M" | "">("");
  const [tipo, setTipo] = useState<"normal" | "vip">("normal");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [cupom, setCupom] = useState("");
  const [cupomValido, setCupomValido] = useState<null | { id: string; desconto: number }>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [seguro, setSeguro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCupom, setLoadingCupom] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/lote-ativo")
      .then((r) => r.json())
      .then((d) => setLote(d.lote));
  }, []);

  function getPreco() {
    if (!lote) return 0;
    if (tipo === "vip") return sexo === "F" ? lote.preco_vip_f : lote.preco_vip_m;
    return sexo === "F" ? lote.preco_f : lote.preco_m;
  }

  function getPrecoExibir(s: "F" | "M", t: "normal" | "vip") {
    if (!lote) return null;
    if (t === "vip") return s === "F" ? lote.preco_vip_f : lote.preco_vip_m;
    return s === "F" ? lote.preco_f : lote.preco_m;
  }

  const preco = getPreco();
  const subtotal = preco * quantidade;
  const desconto = cupomValido ? Math.round(subtotal * cupomValido.desconto) : 0;
  const seguroValor = seguro ? 11.9 * quantidade : 0;
  const subtotalComDesconto = subtotal - desconto;
  const taxa = Math.round(subtotalComDesconto * 0.05 * 100) / 100;
  const total = subtotalComDesconto + seguroValor + taxa;

  async function validarCupom() {
    if (!cupom.trim()) return;
    setLoadingCupom(true);
    setCupomErro("");
    setCupomValido(null);
    const res = await fetch(`/api/cupom?codigo=${encodeURIComponent(cupom.trim())}`);
    const data = await res.json();
    if (res.ok && data.valido) {
      setCupomValido({ id: data.id, desconto: (data.desconto ?? 10) / 100 });
    } else {
      setCupomErro(data.erro ?? "Cupom inválido.");
    }
    setLoadingCupom(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sexo) { setErro("Selecione o sexo."); return; }
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, email, telefone, quantidade, sexo, tipo,
          cupom_id: cupomValido?.id ?? null,
          cupom_desconto: cupomValido ? Math.round(cupomValido.desconto * 100) : null,
          seguro,
          lote_id: lote?.id,
          taxa_pct: 5,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao gerar link de pagamento."); return; }
      window.location.href = data.url;
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-md flex flex-col gap-8">
        <Link href="/" className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors">
          ← Voltar
        </Link>

        <div>
          <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-2">Ingresso</p>
          <h1 className="text-4xl font-bold tracking-tighter">CHAPTER TWO</h1>
          <p className="text-zinc-500 text-sm mt-1">01 de Agosto · Lago Sul</p>
          {lote && <p className="text-zinc-600 text-xs mt-1 tracking-widest uppercase">Lote {lote.numero}</p>}
        </div>

        {/* Seletor de sexo */}
        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-widest uppercase text-zinc-500">Sexo</p>
          <div className="grid grid-cols-2 gap-3">
            {(["F", "M"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSexo(s)}
                className={`py-4 border text-sm tracking-widest uppercase transition-all duration-200 ${
                  sexo === s ? "border-white bg-white text-black" : "border-zinc-800 text-zinc-400 hover:border-zinc-500"
                }`}>
                {s === "F" ? "Feminino" : "Masculino"}
              </button>
            ))}
          </div>
        </div>

        {/* Seletor de tipo */}
        {sexo && (
          <div className="flex flex-col gap-2">
            <p className="text-xs tracking-widest uppercase text-zinc-500">Tipo de ingresso</p>
            <div className="grid grid-cols-2 gap-3">
              {(["normal", "vip"] as const).map((t) => {
                const p = sexo ? getPrecoExibir(sexo, t) : null;
                return (
                  <button key={t} type="button" onClick={() => setTipo(t)}
                    className={`py-4 border text-sm tracking-widest uppercase transition-all duration-200 flex flex-col items-center ${
                      tipo === t ? "border-white bg-white text-black" : "border-zinc-800 text-zinc-400 hover:border-zinc-500"
                    }`}>
                    {t === "normal" ? "Normal" : "VIP"}
                    {p ? <span className={`block text-xs mt-1 font-light ${tipo === t ? "text-black" : "text-zinc-500"}`}>R$ {(p / 100).toFixed(0)},00</span> : null}
                  </button>
                );
              })}
            </div>
            {tipo === "vip" && (
              <p className="text-zinc-600 text-xs tracking-wide">Inclui área VIP, open bar e acesso prioritário.</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest uppercase text-zinc-500">Nome completo</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
              className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="Seu nome" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest uppercase text-zinc-500">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="seu@email.com" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest uppercase text-zinc-500">
              Telefone <span className="text-zinc-700 normal-case">(opcional)</span>
            </label>
            <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)}
              className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="+55 61 99999-9999" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest uppercase text-zinc-500">Quantidade</label>
            <select value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))}
              className="bg-black border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors appearance-none cursor-pointer">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "ingresso" : "ingressos"}</option>
              ))}
            </select>
          </div>

          {/* Cupom */}
          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest uppercase text-zinc-500">
              Cupom <span className="text-zinc-700 normal-case">(opcional)</span>
            </label>
            <div className="flex gap-2">
              <input type="text" value={cupom}
                onChange={(e) => { setCupom(e.target.value); setCupomValido(null); setCupomErro(""); }}
                className="flex-1 bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors uppercase"
                placeholder="CÓDIGO" />
              <button type="button" onClick={validarCupom} disabled={loadingCupom || !cupom.trim()}
                className="px-4 py-3 border border-zinc-700 text-xs tracking-widest uppercase hover:border-white transition-all disabled:opacity-40">
                {loadingCupom ? "..." : "Aplicar"}
              </button>
            </div>
            {cupomValido && <p className="text-green-500 text-xs">Cupom aplicado! -{Math.round(cupomValido.desconto * 100)}%</p>}
            {cupomErro && <p className="text-red-500 text-xs">{cupomErro}</p>}
          </div>

          {/* Seguro reembolsável */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div onClick={() => setSeguro(!seguro)}
              className={`mt-0.5 w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-all ${
                seguro ? "border-white bg-white" : "border-zinc-600 group-hover:border-zinc-400"
              }`}>
              {seguro && <span className="text-black text-xs font-bold">✓</span>}
            </div>
            <div>
              <p className="text-sm text-white">Seguro Reembolsável</p>
              <p className="text-zinc-500 text-xs mt-0.5">+ R$ 11,90 por ingresso · Garante reembolso total se desistir</p>
            </div>
          </label>

          {/* Resumo */}
          <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2">
            {sexo && (
              <div className="flex justify-between text-sm text-zinc-500">
                <span>{quantidade}x {tipo === "vip" ? "VIP" : "Normal"} {sexo === "F" ? "Feminino" : "Masculino"} — R$ {(preco / 100).toFixed(0)},00</span>
                <span>R$ {(subtotal / 100).toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            {desconto > 0 && (
              <div className="flex justify-between text-sm text-green-500">
                <span>Cupom -{cupomValido ? Math.round(cupomValido.desconto * 100) : 0}%</span>
                <span>- R$ {(desconto / 100).toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            {seguro && (
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Seguro {quantidade}x R$ 11,90</span>
                <span>R$ {seguroValor.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Taxa de serviço (5%)</span>
              <span>R$ {(taxa / 100).toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-900 pt-2 mt-1">
              <span className="text-zinc-500 text-sm">Total</span>
              <span className="text-2xl font-light">R$ {(total / 100).toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}

          <button type="submit" disabled={loading || !sexo}
            className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50">
            {loading ? "Gerando pagamento..." : "Ir para pagamento"}
          </button>

          <p className="text-zinc-700 text-xs text-center">Checkout seguro via InfinitePay</p>
        </form>
      </div>
    </main>
  );
}
