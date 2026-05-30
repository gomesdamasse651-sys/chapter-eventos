"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    if (res.ok) {
      const json = await res.json().catch(() => ({})) as { trocar_senha?: boolean };
      if (json.trocar_senha) {
        router.push(`/admin/trocar-senha?email=${encodeURIComponent(email)}`);
      } else {
        router.push("/admin");
      }
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setErro(json.error ?? "Credenciais inválidas.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-5">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold tracking-tighter">CHAPTER</h1>
          <p className="text-zinc-600 text-xs tracking-widest uppercase mt-1">Admin</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs tracking-widest uppercase text-zinc-500">Email</label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            placeholder="seu@email.com"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs tracking-widest uppercase text-zinc-500">Senha</label>
          <input
            type="password" required value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="bg-transparent border border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            placeholder="••••••••"
          />
        </div>

        {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}

        <button type="submit" disabled={loading}
          className="py-3 bg-white text-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-50">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
