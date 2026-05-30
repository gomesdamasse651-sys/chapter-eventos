"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  ingressoId: string;
}

export default function ConfirmadoPending({ ingressoId }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  // Auto-verifica a cada 5s
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [router]);

  async function handleRefresh() {
    setChecking(true);
    router.refresh();
    setTimeout(() => setChecking(false), 1500);
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        <div>
          <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-2">
            Aguardando pagamento
          </p>
          <h1 className="text-3xl font-bold tracking-tighter">CHAPTER TWO</h1>
          <p className="text-zinc-500 text-sm mt-1">01 de Agosto · Lago Sul</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">
            Aguardando confirmação do pagamento...
          </p>
          <p className="text-zinc-700 text-xs">
            Esta página atualiza automaticamente.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={checking}
          className="px-6 py-2.5 border border-zinc-700 text-xs tracking-widest uppercase hover:border-white transition-all disabled:opacity-40"
        >
          {checking ? "Verificando..." : "Verificar agora"}
        </button>

        <p className="text-zinc-700 text-[10px] font-mono">{ingressoId}</p>
      </div>
    </main>
  );
}
