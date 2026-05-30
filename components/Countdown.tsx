"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const EVENTO = new Date("2026-06-13T22:00:00-03:00");

function calcular() {
  const diff = EVENTO.getTime() - Date.now();
  if (diff <= 0) return { dias: 0, hrs: 0, min: 0, seg: 0 };
  const dias = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const seg = Math.floor((diff % 60000) / 1000);
  return { dias, hrs, min, seg };
}

export default function Countdown() {
  const [tempo, setTempo] = useState(calcular);

  useEffect(() => {
    const id = setInterval(() => setTempo(calcular()), 1000);
    return () => clearInterval(id);
  }, []);

  const unidades = [
    { label: "dias", valor: tempo.dias },
    { label: "hrs", valor: tempo.hrs },
    { label: "min", valor: tempo.min },
    { label: "seg", valor: tempo.seg },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex items-center gap-6 md:gap-10"
    >
      {unidades.map((u, i) => (
        <div key={u.label} className="flex items-center gap-6 md:gap-10">
          <div className="flex flex-col items-center">
            <span
              className="font-light tabular-nums leading-none"
              style={{
                fontSize: "clamp(2rem,6vw,3.5rem)",
                fontFamily: "var(--font-inter)",
                letterSpacing: "-0.02em",
              }}
            >
              {String(u.valor).padStart(2, "0")}
            </span>
            <span className="text-zinc-600 text-[10px] tracking-widest uppercase mt-1">
              {u.label}
            </span>
          </div>
          {i < 3 && <span className="text-zinc-700 text-2xl font-light mb-4">·</span>}
        </div>
      ))}
    </motion.div>
  );
}
