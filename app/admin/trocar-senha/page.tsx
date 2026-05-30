"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function TrocarSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 8) {
      setErro("Senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/trocar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nova_senha: novaSenha }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({})) as { error?: string };
      setErro(json.error ?? "Erro ao trocar senha.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-5">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold tracking-tighter">CHAPTER</h1>
          <p className="text-zinc-600 text-xs tracking-widest uppercase mt-1">Troca de senha obrigatória</p>
        </div>

        <p className="text-zinc-500 text-xs text-center">
          Primeiro acesso detectado. Defina uma nova senha para continuar.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs tracking-widest uppercase text-zinc-500">Nova senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            placeholder="Mínimo 8 caracteres"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs tracking-widest uppercase text-zinc-500">Confirmar senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            placeholder="••••••••"
          />
        </div>

        {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}

        <button
          type="submit"
          disabled={loading}
          className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Definir nova senha"}
        </button>
      </form>
    </main>
  );
}

export default function TrocarSenhaPage() {
  return (
    <Suspense>
      <TrocarSenhaForm />
    </Suspense>
  );
}
