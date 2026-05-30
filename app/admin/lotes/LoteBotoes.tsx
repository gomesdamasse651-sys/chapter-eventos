"use client";

import { forcarAbrirLote, forcarFecharLote } from "./actions";
import { useTransition } from "react";

type Props = {
  loteId: string;
  status: string;
};

export default function LoteBotoes({ loteId, status }: Props) {
  const [pending, startTransition] = useTransition();

  if (status === "ativo") {
    return (
      <button
        onClick={() => startTransition(() => forcarFecharLote(loteId))}
        disabled={pending}
        className="text-xs tracking-widest uppercase border border-zinc-700 px-3 py-1.5 hover:border-red-700 hover:text-red-400 transition-colors disabled:opacity-50"
      >
        {pending ? "..." : "Forçar fechar"}
      </button>
    );
  }

  if (status === "fechado") {
    return (
      <button
        onClick={() => startTransition(() => forcarAbrirLote(loteId))}
        disabled={pending}
        className="text-xs tracking-widest uppercase border border-zinc-700 px-3 py-1.5 hover:border-green-700 hover:text-green-400 transition-colors disabled:opacity-50"
      >
        {pending ? "..." : "Forçar abrir"}
      </button>
    );
  }

  return null;
}
