"use client";

import { useState } from "react";
import Link from "next/link";

export default function Comprar() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const total = quantidade * 35;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, telefone, quantidade }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro("Erro ao gerar link de pagamento. Tente novamente.");
        return;
      }

      const url = typeof data.url === "string" ? data.url : JSON.stringify(data.url);
      window.location.href = url;
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
          <h1 className="text-4xl font-bold tracking-tighter">CHAPTER</h1>
          <p className="text-zinc-500 text-sm mt-1">15 de Junho · Lago Sul</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest uppercase text-zinc-500">Nome completo</label>
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
              Telefone <span className="text-zinc-700 normal-case">(opcional)</span>
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="+55 11 99999-9999"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest uppercase text-zinc-500">Quantidade</label>
            <select
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className="bg-black border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "ingresso" : "ingressos"} — R$ {(n * 35).toFixed(2).replace(".", ",")}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center">
            <p className="text-zinc-500 text-sm">Total</p>
            <p className="text-2xl font-light">R$ {total.toFixed(2).replace(".", ",")}</p>
          </div>

          {erro && (
            <p className="text-red-500 text-xs text-center">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Gerando pagamento..." : "Ir para pagamento"}
          </button>

          <p className="text-zinc-700 text-xs text-center">
            Você será redirecionado para o checkout seguro da InfinitePay
          </p>
        </form>
      </div>
    </main>
  );
}
