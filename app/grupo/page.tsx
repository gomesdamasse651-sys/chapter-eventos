"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Lote = { id: number; numero: number; preco_f: number; preco_m: number };
type Participante = { nome: string; sexo: "F" | "M" | "" };

export default function Grupo() {
  const [lote, setLote] = useState<Lote | null>(null);
  const [responsavel, setResponsavel] = useState({ nome: "", email: "", telefone: "" });
  const [participantes, setParticipantes] = useState<Participante[]>(
    Array.from({ length: 6 }, () => ({ nome: "", sexo: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/lote-ativo").then((r) => r.json()).then((d) => setLote(d.lote));
  }, []);

  function addParticipante() {
    if (participantes.length < 15) setParticipantes([...participantes, { nome: "", sexo: "" }]);
  }

  function removeParticipante(i: number) {
    if (participantes.length > 6) setParticipantes(participantes.filter((_, idx) => idx !== i));
  }

  function updateParticipante(i: number, field: keyof Participante, value: string) {
    const updated = [...participantes];
    updated[i] = { ...updated[i], [field]: value };
    setParticipantes(updated);
  }

  const total = participantes.reduce((acc, p) => {
    if (!lote) return acc;
    return acc + (p.sexo === "F" ? lote.preco_f : p.sexo === "M" ? lote.preco_m : 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalidos = participantes.filter((p) => !p.nome || !p.sexo);
    if (invalidos.length > 0) { setErro("Preencha nome e sexo de todos os participantes."); return; }

    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/checkout-grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsavel, participantes, lote_id: lote?.id }),
      });

      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao gerar pagamento."); return; }
      window.location.href = data.url;
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl flex flex-col gap-8">
        <div className="flex gap-6">
          <Link href="/" className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors">← Voltar</Link>
          <Link href="/comprar" className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors">Individual</Link>
        </div>

        <div>
          <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-2">Ingresso em Grupo</p>
          <h1 className="text-4xl font-bold tracking-tighter">CHAPTER</h1>
          <p className="text-zinc-500 text-sm mt-1">6 a 15 pessoas · 15 de Agosto · Acadêmicos da Asa Norte</p>
          {lote && <p className="text-zinc-600 text-xs mt-1 tracking-widest uppercase">Lote {lote.numero}</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Responsável */}
          <div className="flex flex-col gap-3">
            <p className="text-xs tracking-widest uppercase text-zinc-500 border-b border-zinc-900 pb-2">Responsável pelo grupo</p>
            <input
              type="text" required placeholder="Nome completo" value={responsavel.nome}
              onChange={(e) => setResponsavel({ ...responsavel, nome: e.target.value })}
              className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <input
              type="email" required placeholder="Email" value={responsavel.email}
              onChange={(e) => setResponsavel({ ...responsavel, email: e.target.value })}
              className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <input
              type="tel" placeholder="Telefone (opcional)" value={responsavel.telefone}
              onChange={(e) => setResponsavel({ ...responsavel, telefone: e.target.value })}
              className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Participantes */}
          <div className="flex flex-col gap-3">
            <p className="text-xs tracking-widest uppercase text-zinc-500 border-b border-zinc-900 pb-2">
              Participantes ({participantes.length})
            </p>
            {participantes.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text" placeholder={`Nome ${i + 1}`} value={p.nome}
                  onChange={(e) => updateParticipante(i, "nome", e.target.value)}
                  className="flex-1 bg-transparent border border-zinc-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                />
                <select
                  value={p.sexo}
                  onChange={(e) => updateParticipante(i, "sexo", e.target.value)}
                  className="bg-black border border-zinc-800 px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  <option value="">Sexo</option>
                  <option value="F">F — R${lote?.preco_f ?? "?"}</option>
                  <option value="M">M — R${lote?.preco_m ?? "?"}</option>
                </select>
                {participantes.length > 6 && (
                  <button type="button" onClick={() => removeParticipante(i)}
                    className="text-zinc-600 hover:text-red-400 text-lg px-1 transition-colors">×</button>
                )}
              </div>
            ))}

            {participantes.length < 15 && (
              <button type="button" onClick={addParticipante}
                className="py-2 border border-zinc-800 text-xs tracking-widest uppercase text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-all">
                + Adicionar participante
              </button>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center">
            <p className="text-zinc-500 text-sm">Total</p>
            <p className="text-2xl font-light">R$ {total.toFixed(2).replace(".", ",")}</p>
          </div>

          {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}

          <button type="submit" disabled={loading}
            className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50">
            {loading ? "Gerando pagamento..." : "Ir para pagamento"}
          </button>
        </form>
      </div>
    </main>
  );
}
