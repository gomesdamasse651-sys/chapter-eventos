"use client";

import { useState, useEffect, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";

function TrocarSenhaForm() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pronto, setPronto] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token) {
        await supabase.auth.setSession({ access_token, refresh_token: refresh_token || "" });
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPronto(true);
      } else {
        setErro("Link inválido ou expirado. Solicite um novo.");
      }
    }
    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) {
      setErro("Erro ao atualizar senha. Tente novamente.");
      setLoading(false);
      return;
    }

    setSucesso("Senha alterada com sucesso!");
    setTimeout(() => router.push("/dashboard"), 2000);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <Logo size={28} />
          <Link href="/" className="text-3xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
            CHAPTER
          </Link>
          <p className="text-zinc-600 text-xs tracking-widest uppercase">Trocar senha</p>
        </div>

        {erro && !pronto && (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-red-400 text-xs">{erro}</p>
            <Link href="/login" className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors">
              ← Voltar ao login
            </Link>
          </div>
        )}

        {pronto && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest uppercase text-zinc-500">Nova senha</label>
              <input
                type="password" required value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest uppercase text-zinc-500">Confirmar senha</label>
              <input
                type="password" required value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {erro && <p className="text-red-400 text-xs text-center">{erro}</p>}
            {sucesso && <p className="text-green-400 text-xs text-center">{sucesso}</p>}

            <button type="submit" disabled={loading}
              className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-50">
              {loading ? "..." : "Salvar nova senha"}
            </button>
          </form>
        )}

        <Link href="/login" className="text-zinc-700 text-xs tracking-widest uppercase hover:text-white transition-colors text-center">
          ← Voltar ao login
        </Link>
      </div>
    </main>
  );
}

export default function TrocarSenha() {
  return (
    <Suspense>
      <TrocarSenhaForm />
    </Suspense>
  );
}
