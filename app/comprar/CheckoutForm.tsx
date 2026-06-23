"use client";

import { useState } from "react";
import type { Categoria } from "@/lib/lotes";

const PRECO_SEGURO = 25;

interface Props {
  loteId: string;
  categoria: Categoria;
  categoriaLabel: string;
  precoReais: number;
  loteNumero: number;
}

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function CheckoutForm({
  loteId,
  categoria,
  categoriaLabel,
  precoReais,
  loteNumero,
}: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [seguro, setSeguro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Cupom
  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<{
    codigo: string;
    desconto: number;
    preco_final: number;
  } | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);

  const precoBase = cupomAplicado ? cupomAplicado.preco_final : precoReais;
  const total = precoBase + (seguro ? PRECO_SEGURO : 0);

  function handleTelefone(e: React.ChangeEvent<HTMLInputElement>) {
    setTelefone(maskTelefone(e.target.value));
  }

  async function handleAplicarCupom() {
    if (!codigoCupom.trim()) return;
    setCupomLoading(true);
    setCupomErro("");
    setCupomAplicado(null);

    try {
      const res = await fetch("/api/cupons/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoCupom.trim(), preco: precoReais }),
      });
      const data = await res.json() as {
        valido: boolean;
        codigo?: string;
        desconto?: number;
        preco_final?: number;
      };

      if (data.valido && data.desconto !== undefined && data.preco_final !== undefined && data.codigo) {
        setCupomAplicado({
          codigo: data.codigo,
          desconto: data.desconto,
          preco_final: data.preco_final,
        });
      } else {
        setCupomErro("Cupom inválido ou expirado.");
      }
    } catch {
      setCupomErro("Erro ao validar cupom.");
    } finally {
      setCupomLoading(false);
    }
  }

  function handleRemoverCupom() {
    setCupomAplicado(null);
    setCodigoCupom("");
    setCupomErro("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lote_id: loteId,
          categoria,
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.replace(/\D/g, "") || undefined,
          seguro_reembolso: seguro,
          ...(cupomAplicado
            ? { codigo_cupom: cupomAplicado.codigo, desconto: cupomAplicado.desconto }
            : {}),
        }),
      });

      const data = (await res.json()) as { checkout_url?: string; error?: string };

      if (!res.ok || !data.checkout_url) {
        setErro(data.error ?? "Erro ao gerar link de pagamento.");
        return;
      }

      window.location.href = data.checkout_url;
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs tracking-widest uppercase text-zinc-500">
          Nome completo
        </label>
        <input
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
          placeholder="Seu nome"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs tracking-widest uppercase text-zinc-500">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
          placeholder="seu@email.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs tracking-widest uppercase text-zinc-500">
          Telefone{" "}
          <span className="text-zinc-700 normal-case">(opcional)</span>
        </label>
        <input
          type="tel"
          value={telefone}
          onChange={handleTelefone}
          className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
          placeholder="(61) 99999-9999"
        />
      </div>

      {/* Cupom */}
      <div className="flex flex-col gap-2">
        <label className="text-xs tracking-widest uppercase text-zinc-500">
          Cupom{" "}
          <span className="text-zinc-700 normal-case">(opcional)</span>
        </label>
        {cupomAplicado ? (
          <div className="flex items-center justify-between border border-zinc-800 px-4 py-3">
            <span className="text-green-400 text-sm tracking-widest uppercase">
              {cupomAplicado.codigo} — −R$ {cupomAplicado.desconto.toFixed(2).replace(".", ",")}
            </span>
            <button
              type="button"
              onClick={handleRemoverCupom}
              className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors"
            >
              Remover
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={codigoCupom}
              onChange={(e) => { setCodigoCupom(e.target.value.toUpperCase()); setCupomErro(""); }}
              className="flex-1 bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors uppercase tracking-widest text-sm"
              placeholder="CÓDIGO"
            />
            <button
              type="button"
              onClick={handleAplicarCupom}
              disabled={cupomLoading || !codigoCupom.trim()}
              className="px-4 py-3 border border-zinc-700 text-xs tracking-widest uppercase hover:border-white transition-colors disabled:opacity-40"
            >
              {cupomLoading ? "..." : "Aplicar"}
            </button>
          </div>
        )}
        {cupomErro && (
          <p className="text-red-500 text-xs">{cupomErro}</p>
        )}
      </div>

      {/* Seguro reembolsável */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          onClick={() => setSeguro(!seguro)}
          className={`mt-0.5 w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-all ${
            seguro
              ? "border-white bg-white"
              : "border-zinc-600 group-hover:border-zinc-400"
          }`}
        >
          {seguro && <span className="text-black text-xs font-bold">✓</span>}
        </div>
        <div>
          <p className="text-sm text-white">Seguro Reembolsável</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            + R$ {PRECO_SEGURO},00 · Garante reembolso total se você não puder
            comparecer
          </p>
        </div>
      </label>

      {/* Resumo */}
      <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2">
        <div className="flex justify-between text-sm text-zinc-500">
          <span>
            {categoriaLabel} — Lote {loteNumero}
          </span>
          <span>R$ {precoReais.toFixed(2).replace(".", ",")}</span>
        </div>
        {cupomAplicado && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Desconto ({cupomAplicado.codigo})</span>
            <span>−R$ {cupomAplicado.desconto.toFixed(2).replace(".", ",")}</span>
          </div>
        )}
        {seguro && (
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Seguro Reembolsável</span>
            <span>R$ {PRECO_SEGURO},00</span>
          </div>
        )}
        <div className="flex justify-between items-center border-t border-zinc-900 pt-2 mt-1">
          <span className="text-zinc-500 text-sm">Total</span>
          <span className="text-2xl font-light">
            R$ {total.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}

      <button
        type="submit"
        disabled={loading}
        className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "Gerando pagamento..." : "Ir para pagamento"}
      </button>

      <p className="text-zinc-700 text-xs text-center">
        Checkout seguro via InfinitePay
      </p>
    </form>
  );
}
