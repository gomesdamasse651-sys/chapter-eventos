"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

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
  const [emailUsuario, setEmailUsuario] = useState("");
  const [userId, setUserId] = useState("");
  const [aba, setAba] = useState<"ingressos" | "perfil">("ingressos");
  const router = useRouter();

  // Perfil
  const [editando, setEditando] = useState(false);
  const [editandoSenha, setEditandoSenha] = useState(false);
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilTelefone, setPerfilTelefone] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      setEmailUsuario(user.email ?? "");
      const nomeAuth = user.user_metadata?.nome ?? "";
      setNomeUsuario(nomeAuth.split(" ")[0] || user.email?.split("@")[0] || "");

      // Busca perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, telefone")
        .eq("id", user.id)
        .single();

      setPerfilNome(profile?.nome ?? nomeAuth);
      setPerfilTelefone(profile?.telefone ?? "");

      fetch("/api/cliente/ingressos")
        .then((r) => r.json())
        .then((d) => { setIngressos(d.ingressos ?? []); setLoading(false); });
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function salvarPerfil() {
    setSalvando(true);
    setMsg(null);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      nome: perfilNome,
      telefone: perfilTelefone,
      atualizado_em: new Date().toISOString(),
    });
    await supabase.auth.updateUser({ data: { nome: perfilNome } });
    if (error) {
      setMsg({ tipo: "erro", texto: "Erro ao salvar." });
    } else {
      setMsg({ tipo: "ok", texto: "Perfil atualizado." });
      setNomeUsuario(perfilNome.split(" ")[0]);
      setEditando(false);
    }
    setSalvando(false);
  }

  async function salvarSenha() {
    if (senhaNova !== senhaConfirm) {
      setMsg({ tipo: "erro", texto: "As senhas não coincidem." });
      return;
    }
    if (senhaNova.length < 6) {
      setMsg({ tipo: "erro", texto: "Senha deve ter pelo menos 6 caracteres." });
      return;
    }
    setSalvando(true);
    setMsg(null);
    // Re-autentica com senha atual para garantir segurança
    const { error: errLogin } = await supabase.auth.signInWithPassword({
      email: emailUsuario,
      password: senhaAtual,
    });
    if (errLogin) {
      setMsg({ tipo: "erro", texto: "Senha atual incorreta." });
      setSalvando(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: senhaNova });
    if (error) {
      setMsg({ tipo: "erro", texto: "Erro ao atualizar senha." });
    } else {
      setMsg({ tipo: "ok", texto: "Senha atualizada com sucesso." });
      setSenhaAtual(""); setSenhaNova(""); setSenhaConfirm("");
      setEditandoSenha(false);
    }
    setSalvando(false);
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
          <Logo size={20} />
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

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
        {/* Saudação */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.5 }} className="flex flex-col gap-2">
          <p className="text-zinc-500 text-xs tracking-widest uppercase">Bem-vindo de volta</p>
          <h1 className="text-4xl font-light" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
            Olá, {nomeUsuario}
          </h1>
          <p className="text-zinc-500 text-sm tracking-wide mt-1">01 de Agosto · Lago Sul</p>
        </motion.div>

        {/* Abas */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.5, delay: 0.08 }}
          className="grid grid-cols-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {(["ingressos", "perfil"] as const).map((a) => (
            <button key={a} onClick={() => { setAba(a); setMsg(null); setEditando(false); setEditandoSenha(false); }}
              className={`py-3 text-xs tracking-widest uppercase transition-colors relative ${
                aba === a ? "text-white" : "text-zinc-600 hover:text-zinc-400"
              }`}>
              {a === "ingressos" ? "Ingressos" : "Perfil"}
              {aba === a && (
                <motion.div layoutId="aba-indicator" className="absolute bottom-0 left-0 right-0 h-px bg-white" />
              )}
            </button>
          ))}
        </motion.div>

        {/* Conteúdo das abas */}
        <AnimatePresence mode="wait">
          {aba === "ingressos" ? (
            <motion.div key="ingressos" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }} className="flex flex-col gap-4">

              {ingressos.length === 0 ? (
                <div className="text-center py-20 flex flex-col gap-6 border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <p className="text-zinc-600 text-sm">Nenhum ingresso encontrado.</p>
                  <Link href="/comprar"
                    className="px-8 py-3 border text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all mx-auto"
                    style={{ borderColor: "rgba(255,255,255,0.3)" }}>
                    Comprar ingresso
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {ingressos.map((ing, i) => (
                    <motion.div key={ing.id} variants={fadeUp} initial="hidden" animate="show"
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      className="flex flex-col gap-6 p-7 border"
                      style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-white font-medium tracking-wide">{ing.nome}</p>
                          <p className="text-zinc-500 text-xs tracking-widest uppercase">
                            {ing.sexo === "F" ? "Feminino" : "Masculino"}
                            {ing.lotes ? ` · Lote ${(ing.lotes as unknown as { numero: number }).numero}` : ""}
                            {ing.seguro ? " · Seguro" : ""}
                          </p>
                        </div>
                        <span className={`text-xs px-3 py-1 tracking-widest uppercase shrink-0 ${
                          ing.status === "pago" ? "bg-white text-black" :
                          ing.status === "usado" ? "border text-zinc-500" :
                          "border border-yellow-700 text-yellow-500"
                        }`} style={ing.status === "usado" ? { borderColor: "rgba(255,255,255,0.2)" } : {}}>
                          {ing.status === "usado" ? "Usado" : ing.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </div>

                      {ing.status === "pago" && ing.qr_code && (
                        <div className="flex flex-col items-center gap-4 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                          <div className="p-3 bg-white">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`${appUrl}/validar/${ing.qr_code}`)}`}
                              alt="QR Code" className="w-48 h-48 block"
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

                  <Link href="/comprar"
                    className="block text-center py-4 border text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all mt-2"
                    style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                    Comprar novo ingresso
                  </Link>
                </div>
              )}
            </motion.div>

          ) : (
            <motion.div key="perfil" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }} className="flex flex-col gap-6">

              {msg && (
                <p className={`text-xs text-center tracking-wide ${msg.tipo === "ok" ? "text-green-400" : "text-red-400"}`}>
                  {msg.texto}
                </p>
              )}

              {/* Dados pessoais */}
              <div className="flex flex-col gap-4 p-6 border" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs tracking-widest uppercase text-zinc-500">Dados pessoais</p>
                  {!editando ? (
                    <button onClick={() => { setEditando(true); setMsg(null); }}
                      className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors border px-3 py-1"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditando(false); setMsg(null); }}
                        className="text-xs tracking-widest uppercase text-zinc-600 hover:text-white transition-colors px-3 py-1">
                        Cancelar
                      </button>
                      <button onClick={salvarPerfil} disabled={salvando}
                        className="text-xs tracking-widest uppercase border px-3 py-1 hover:bg-white hover:text-black transition-all disabled:opacity-50"
                        style={{ borderColor: "rgba(255,255,255,0.3)" }}>
                        {salvando ? "..." : "Salvar"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] tracking-widest uppercase text-zinc-600">Nome completo</label>
                    {editando ? (
                      <input type="text" value={perfilNome} onChange={(e) => setPerfilNome(e.target.value)}
                        className="bg-transparent border px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                        style={{ borderColor: "rgba(255,255,255,0.15)" }} />
                    ) : (
                      <p className="text-white text-sm py-3">{perfilNome || "—"}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] tracking-widest uppercase text-zinc-600">Email</label>
                    <p className="text-zinc-500 text-sm py-3">{emailUsuario}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] tracking-widest uppercase text-zinc-600">Telefone</label>
                    {editando ? (
                      <input type="tel" value={perfilTelefone} onChange={(e) => setPerfilTelefone(e.target.value)}
                        placeholder="+55 61 99999-9999"
                        className="bg-transparent border px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                        style={{ borderColor: "rgba(255,255,255,0.15)" }} />
                    ) : (
                      <p className="text-white text-sm py-3">{perfilTelefone || "—"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-4 p-6 border" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs tracking-widest uppercase text-zinc-500">Senha</p>
                  {!editandoSenha ? (
                    <button onClick={() => { setEditandoSenha(true); setMsg(null); }}
                      className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors border px-3 py-1"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      Alterar
                    </button>
                  ) : (
                    <button onClick={() => { setEditandoSenha(false); setMsg(null); setSenhaAtual(""); setSenhaNova(""); setSenhaConfirm(""); }}
                      className="text-xs tracking-widest uppercase text-zinc-600 hover:text-white transition-colors px-3 py-1">
                      Cancelar
                    </button>
                  )}
                </div>

                {!editandoSenha ? (
                  <p className="text-zinc-700 text-sm">••••••••</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {[
                      { label: "Senha atual", value: senhaAtual, set: setSenhaAtual },
                      { label: "Nova senha", value: senhaNova, set: setSenhaNova },
                      { label: "Confirmar nova senha", value: senhaConfirm, set: setSenhaConfirm },
                    ].map(({ label, value, set }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <label className="text-[10px] tracking-widest uppercase text-zinc-600">{label}</label>
                        <input type="password" value={value} onChange={(e) => set(e.target.value)}
                          className="bg-transparent border px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                          style={{ borderColor: "rgba(255,255,255,0.15)" }} placeholder="••••••••" />
                      </div>
                    ))}
                    <button onClick={salvarSenha} disabled={salvando}
                      className="py-3 border text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all disabled:opacity-50 mt-1"
                      style={{ borderColor: "rgba(255,255,255,0.3)" }}>
                      {salvando ? "Salvando..." : "Atualizar senha"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-zinc-700 text-xs">Desenvolvido por Gabriel Gomes Damasse</p>
      </footer>
    </main>
  );
}
