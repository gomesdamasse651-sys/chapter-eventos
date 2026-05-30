"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

type IngressoReembolso = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  status: string;
  seguro_reembolso: boolean;
  reembolso_solicitado: boolean;
  reembolso_solicitado_em: string | null;
  reembolso_pago: boolean;
  lotes: { numero: number } | null;
};

function categoriaLabel(cat: string): string {
  const map: Record<string, string> = {
    masc_normal: "Masculino — Normal",
    fem_normal: "Feminino — Normal",
    masc_vip: "Masculino — VIP",
    fem_vip: "Feminino — VIP",
  };
  return map[cat] ?? cat;
}

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ReembolsoPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [ingressos, setIngressos] = useState<IngressoReembolso[]>([]);
  const [loading, setLoading] = useState(true);
  const [formulario, setFormulario] = useState<string | null>(null); // ingresso_id ativo
  const [chavePix, setChavePix] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      carregarIngressos();
    });
  }, [router]);

  async function carregarIngressos() {
    const res = await fetch("/api/cliente/ingressos");
    const d = await res.json() as { ingressos?: IngressoReembolso[] };
    setIngressos(d.ingressos ?? []);
    setLoading(false);
  }

  async function solicitarReembolso(ingressoId: string) {
    if (!chavePix.trim()) {
      setMsg({ tipo: "erro", texto: "Informe a chave pix." });
      return;
    }
    setEnviando(true);
    setMsg(null);
    const res = await fetch("/api/cliente/reembolso", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingresso_id: ingressoId, chave_pix: chavePix }),
    });
    const d = await res.json() as { error?: string };
    if (!res.ok) {
      setMsg({ tipo: "erro", texto: d.error ?? "Erro ao solicitar reembolso." });
    } else {
      setMsg({ tipo: "ok", texto: "Reembolso solicitado com sucesso. Processaremos em até 48h." });
      setFormulario(null);
      setChavePix("");
      carregarIngressos();
    }
    setEnviando(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <p className="text-zinc-600 text-xs tracking-widest uppercase">Carregando...</p>
      </main>
    );
  }

  const elegíveis = ingressos.filter((i) => i.status === "pago" && i.seguro_reembolso);

  return (
    <main className="min-h-screen text-white flex flex-col" style={{ background: "#080808" }}>
      <header className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
          <Logo size={20} />
          <span className="text-sm font-bold tracking-widest uppercase">Chapter</span>
        </Link>
        <Link href="/dashboard" className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors">
          ← Voltar
        </Link>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-zinc-500 text-xs tracking-widest uppercase">Área do cliente</p>
          <h1 className="text-3xl font-light" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
            Solicitar Reembolso
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Disponível apenas para ingressos com seguro reembolsável.
          </p>
        </div>

        {msg && (
          <p className={`text-xs text-center tracking-wide py-3 border ${msg.tipo === "ok" ? "text-green-400 border-green-900" : "text-red-400 border-red-900"}`}>
            {msg.texto}
          </p>
        )}

        {elegíveis.length === 0 ? (
          <div className="border p-8 text-center flex flex-col gap-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-zinc-500 text-sm">Nenhum ingresso elegível para reembolso.</p>
            <p className="text-zinc-700 text-xs">Apenas ingressos pagos com seguro reembolsável podem solicitar reembolso.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {elegíveis.map((ing) => (
              <div key={ing.id} className="flex flex-col gap-4 p-6 border" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-white text-sm font-medium">{ing.nome}</p>
                    <p className="text-zinc-500 text-xs tracking-widest uppercase">
                      {categoriaLabel(ing.categoria)}
                      {ing.lotes ? ` · Lote ${(ing.lotes as { numero: number }).numero}` : ""}
                    </p>
                    <p className="text-zinc-400 text-xs">R$ {ing.preco.toFixed(0)},00</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 border border-emerald-800 text-emerald-400 tracking-widest uppercase shrink-0">
                    Seguro ativo
                  </span>
                </div>

                {ing.reembolso_pago ? (
                  <p className="text-xs text-green-400 tracking-wide border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    Reembolso processado em {ing.reembolso_solicitado_em ? formatData(ing.reembolso_solicitado_em) : "—"}
                  </p>
                ) : ing.reembolso_solicitado ? (
                  <p className="text-xs text-zinc-400 tracking-wide border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    Reembolso solicitado em {ing.reembolso_solicitado_em ? formatData(ing.reembolso_solicitado_em) : "—"} — aguardando processamento
                  </p>
                ) : formulario === ing.id ? (
                  <div className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] tracking-widest uppercase text-zinc-600">Chave Pix (CPF, email, telefone ou chave aleatória)</label>
                      <input
                        type="text"
                        value={chavePix}
                        onChange={(e) => setChavePix(e.target.value)}
                        placeholder="Ex: 000.000.000-00 ou seu@email.com"
                        className="bg-transparent border px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                        style={{ borderColor: "rgba(255,255,255,0.15)" }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setFormulario(null); setChavePix(""); setMsg(null); }}
                        className="text-xs tracking-widest uppercase text-zinc-600 hover:text-white transition-colors px-4 py-2"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => solicitarReembolso(ing.id)}
                        disabled={enviando}
                        className="flex-1 py-2 border text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all disabled:opacity-50"
                        style={{ borderColor: "rgba(255,255,255,0.3)" }}
                      >
                        {enviando ? "Enviando..." : "Confirmar solicitação"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setFormulario(ing.id); setMsg(null); }}
                    className="text-xs tracking-widest uppercase border px-4 py-2 hover:bg-white hover:text-black transition-all self-start"
                    style={{ borderColor: "rgba(255,255,255,0.2)" }}
                  >
                    Solicitar Reembolso
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {ingressos.filter((i) => !i.seguro_reembolso && i.status === "pago").length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] tracking-widest uppercase text-zinc-700">Ingressos sem seguro</p>
            {ingressos.filter((i) => !i.seguro_reembolso && i.status === "pago").map((ing) => (
              <div key={ing.id} className="flex items-center justify-between p-4 border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex flex-col gap-0.5">
                  <p className="text-zinc-500 text-sm">{ing.nome}</p>
                  <p className="text-zinc-700 text-xs tracking-widest uppercase">{categoriaLabel(ing.categoria)}</p>
                </div>
                <span className="text-zinc-700 text-xs">Sem seguro reembolsável</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center py-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-zinc-700 text-xs">Desenvolvido por Gabriel Gomes Damasse</p>
      </footer>
    </main>
  );
}
