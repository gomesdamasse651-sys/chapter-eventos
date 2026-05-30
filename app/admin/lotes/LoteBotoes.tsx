"use client";

import { forcarAbrirLote, forcarFecharLote } from "./actions";
import { useTransition } from "react";

type Props = {
  loteId: number;
  ativo: boolean;
};

export default function LoteBotoes({ loteId, ativo }: Props) {
  const [pending, startTransition] = useTransition();

  if (ativo) {
    return (
      <button
        onClick={() => startTransition(() => forcarFecharLote(loteId))}
        disabled={pending}
        className="text-[12px] px-3 py-1 rounded transition-colors disabled:opacity-40"
        style={{
          border: "0.5px solid #E24B4A",
          color: "#A32D2D",
          background: "transparent",
        }}
      >
        {pending ? "..." : "Forçar fechar"}
      </button>
    );
  }

  return (
    <button
      onClick={() => startTransition(() => forcarAbrirLote(loteId))}
      disabled={pending}
      className="text-[12px] px-3 py-1 rounded transition-colors disabled:opacity-40"
      style={{
        border: "0.5px solid #639922",
        color: "#27500A",
        background: "transparent",
      }}
    >
      {pending ? "..." : "Forçar abrir"}
    </button>
  );
}
