"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Logo from "@/components/Logo";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const supabase = createSupabaseBrowserClient();
  const [aba, setAba] = useState<"cliente" | "admin">("cliente");
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [emailRecupera, setEmailRecupera] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleCliente(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setSucesso("");

    if (modo === "cadastro") {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      });
      if (error) { setErro(error.message); setLoading(false); return; }
      setSucesso("Conta criada! Verifique seu email para confirmar.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      console.error("[login cliente] signInWithPassword error:", error.message, error);
      setErro("Email ou senha incorretos.");
      setLoading(false);
      return;
    }
    const redirect = searchParams.get("redirect") ?? "/dashboard";
    router.push(redirect);
    router.refresh();
    setLoading(false);
  }

  async function handleEsqueci(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setSucesso("");
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecupera, {
      redirectTo: "https://chapter-eventos.vercel.app/trocar-senha",
    });
    if (error) {
      setErro("Erro ao enviar email. Verifique o endereço.");
    } else {
      setSucesso("Email enviado! Verifique sua caixa de entrada.");
    }
    setLoading(false);
  }

  async function handleAdmin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailAdmin, senha }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setErro(json.error ?? "Credenciais inválidas.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <Logo size={28} />
          <Link href="/" className="text-3xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
            CHAPTER
          </Link>
          <p className="text-zinc-600 text-xs tracking-widest uppercase">15 de Agosto</p>
        </div>

        {/* Abas */}
        <div className="grid grid-cols-2 border border-zinc-800">
          {(["cliente", "admin"] as const).map((a) => (
            <button key={a} onClick={() => { setAba(a); setErro(""); setSucesso(""); }}
              className={`py-2 text-xs tracking-widest uppercase transition-colors ${aba === a ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}>
              {a === "cliente" ? "Cliente" : "Administrador"}
            </button>
          ))}
        </div>

        {/* Aba Cliente */}
        {aba === "cliente" && (
          <form onSubmit={handleCliente} className="flex flex-col gap-4">
            {modo === "cadastro" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs tracking-widest uppercase text-zinc-500">Nome</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                  className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="Seu nome completo" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest uppercase text-zinc-500">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="seu@email.com" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest uppercase text-zinc-500">Senha</label>
              <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="••••••••" />
            </div>

            {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}
            {sucesso && <p className="text-green-400 text-xs text-center">{sucesso}</p>}

            <button type="submit" disabled={loading}
              className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-50">
              {loading ? "..." : modo === "login" ? "Entrar" : "Criar conta"}
            </button>

            <button type="button" onClick={() => { setModo(modo === "login" ? "cadastro" : "login"); setErro(""); setSucesso(""); }}
              className="text-zinc-600 text-xs tracking-widest uppercase hover:text-zinc-400 transition-colors text-center">
              {modo === "login" ? "Criar conta" : "Já tenho conta"}
            </button>

            {modo === "login" && !esqueci && (
              <button type="button" onClick={() => { setEsqueci(true); setErro(""); setSucesso(""); }}
                className="text-zinc-700 text-xs tracking-widest uppercase hover:text-zinc-500 transition-colors text-center">
                Esqueci minha senha
              </button>
            )}

            {modo === "login" && esqueci && (
              <form onSubmit={handleEsqueci} className="flex flex-col gap-3 border-t border-zinc-900 pt-4">
                <p className="text-zinc-500 text-xs tracking-widest uppercase text-center">Recuperar senha</p>
                <input
                  type="email" required value={emailRecupera}
                  onChange={(e) => setEmailRecupera(e.target.value)}
                  className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="seu@email.com"
                />
                <button type="submit" disabled={loading}
                  className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-50">
                  {loading ? "..." : "Enviar link"}
                </button>
                <button type="button" onClick={() => { setEsqueci(false); setErro(""); setSucesso(""); }}
                  className="text-zinc-700 text-xs tracking-widest uppercase hover:text-zinc-500 transition-colors text-center">
                  Cancelar
                </button>
              </form>
            )}
          </form>
        )}

        {/* Aba Admin */}
        {aba === "admin" && (
          <form onSubmit={handleAdmin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest uppercase text-zinc-500">Email</label>
              <input type="email" required value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)}
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="seu@email.com" autoFocus />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest uppercase text-zinc-500">Senha</label>
              <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="••••••••" />
            </div>

            {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}

            <button type="submit" disabled={loading}
              className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-50">
              {loading ? "..." : "Entrar"}
            </button>
          </form>
        )}

        <Link href="/" className="text-zinc-700 text-xs tracking-widest uppercase hover:text-white transition-colors text-center">
          ← Voltar
        </Link>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
