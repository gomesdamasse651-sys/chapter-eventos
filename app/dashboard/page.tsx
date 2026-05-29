"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

type Ingresso = {
  id: string; nome: string; sexo: string; status: string;
  qr_code: string | null; preco: number; seguro: boolean;
  paid_at: string | null; lotes: { numero: number } | null;
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const supabase = createSupabaseBrowserClient();
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setNomeUsuario(user.user_metadata?.nome ?? user.email ?? "");
      fetch("/api/cliente/ingressos")
        .then((r) => r.json())
        .then((d) => { setIngressos(d.ingressos ?? []); setLoading(false); });
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://chapter-eventos.vercel.app";

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <p className="text-zinc-600 text-xs tracking-widest uppercase">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white flex flex-col" style={{ background: "#080808" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="0" y="0" width="9" height="9" fill="white" />
            <rect x="11" y="0" width="9" height="9" fill="white" />
            <rect x="0" y="11" width="9" height="9" fill="white" />
            <rect x="11" y="11" width="9" height="9" fill="white" />
          </svg>
          <span className="text-sm font-bold tracking-widest uppercase">Chapter</span>
        </Link>
        <button
          onClick={logout}
          className="text-xs tracking-widest uppercase text-zinc-500 hover:text-red-400 transition-colors border px-4 py-2"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          Sair
        </button>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
        {/* Saudação */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-2"
        >
          <p className="text-zinc-500 text-xs tracking-widest uppercase">Bem-vindo de volta</p>
          <h1 className="text-4xl font-light" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
            Olá, {nomeUsuario.split(" ")[0]}
          </h1>
          <p className="text-zinc-500 text-sm tracking-wide mt-1">01 de Agosto · Lago Sul</p>
        </motion.div>

        {/* Ingressos */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <p className="text-xs tracking-widest uppercase text-zinc-600 border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            Meus ingressos
          </p>

          {ingressos.length === 0 ? (
            <div className="text-center py-20 flex flex-col gap-6 border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-zinc-600 text-sm">Nenhum ingresso encontrado.</p>
              <Link
                href="/comprar"
                className="px-8 py-3 border text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all mx-auto"
                style={{ borderColor: "rgba(255,255,255,0.3)" }}
              >
                Comprar ingresso
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {ingressos.map((ing, i) => (
                <motion.div
                  key={ing.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className="flex flex-col gap-6 p-7 border"
                  style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
                >
                  {/* Info + badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-white font-medium tracking-wide">{ing.nome}</p>
                      <p className="text-zinc-500 text-xs tracking-widest uppercase">
                        {ing.sexo === "F" ? "Feminino" : "Masculino"}
                        {ing.lotes ? ` · Lote ${(ing.lotes as unknown as { numero: number }).numero}` : ""}
                        {ing.seguro ? " · Seguro" : ""}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 tracking-widest uppercase shrink-0 ${
                        ing.status === "pago"
                          ? "bg-white text-black"
                          : ing.status === "usado"
                          ? "border text-zinc-500"
                          : "border border-yellow-700 text-yellow-500"
                      }`}
                      style={ing.status === "usado" ? { borderColor: "rgba(255,255,255,0.2)" } : {}}
                    >
                      {ing.status === "usado" ? "Usado" : ing.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </div>

                  {/* QR code */}
                  {ing.status === "pago" && ing.qr_code && (
                    <div className="flex flex-col items-center gap-4 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <div className="p-3 bg-white">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`${appUrl}/validar/${ing.qr_code}`)}`}
                          alt="QR Code"
                          className="w-48 h-48 block"
                        />
                      </div>
                      <p className="text-zinc-600 text-xs tracking-widest uppercase">Apresente este QR code na entrada</p>
                      <p className="text-zinc-700 text-xs font-mono">{ing.qr_code}</p>
                    </div>
                  )}

                  {ing.status === "pendente" && (
                    <p className="text-zinc-600 text-xs tracking-wide border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      Aguardando confirmação do pagamento.
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Botão comprar */}
        {ingressos.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link
              href="/comprar"
              className="block text-center py-4 border text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all"
              style={{ borderColor: "rgba(255,255,255,0.2)" }}
            >
              Comprar novo ingresso
            </Link>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-zinc-700 text-xs">Desenvolvido por Gabriel Gomes Damasse</p>
      </footer>
    </main>
  );
}
