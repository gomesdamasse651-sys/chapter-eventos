"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const EVENTO = new Date("2026-07-04T22:00:00-03:00");
const GOLD = "#a8ff78";

interface Props {
  vagasTotal: number;
  esgotado: boolean;
  precoF?: number;
  precoM?: number;
  loteNumero?: number;
}

function useCountdown() {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const tick = () => setDiff(Math.max(0, EVENTO.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const dias = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const min  = Math.floor((diff % 3600000) / 60000);
  return { dias, hrs, min };
}

function Pad({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-5xl md:text-6xl leading-none tabular-nums"
        style={{ fontFamily: "var(--font-bebas)", color: GOLD }}
      >
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(168,255,120,0.5)" }}>
        {label}
      </span>
    </div>
  );
}

export default function HeroAnimado({ vagasTotal, esgotado, precoF, precoM, loteNumero }: Props) {
  const { dias, hrs, min } = useCountdown();

  const precoExibir = precoF
    ? `A partir de R$ ${Math.round(precoF / 100)}`
    : null;

  return (
    <section className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/chapter-poster.png"
          alt=""
          className="w-full h-full object-cover"
          style={{ animation: "slowZoom 20s ease-in-out infinite alternate" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.92) 100%)",
          }}
        />
      </div>

      {/* Lote badge */}
      {loteNumero && (
        <div className="absolute top-24 right-6 z-10 text-right">
          <div
            className="text-[9px] tracking-[0.35em] uppercase mb-1"
            style={{ color: "rgba(168,255,120,0.6)" }}
          >
            Lote {loteNumero}
          </div>
          {precoExibir && (
            <div className="text-xs" style={{ color: GOLD, fontFamily: "var(--font-cormorant)" }}>
              {precoExibir}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-end flex-1 pb-16 px-6 text-center gap-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center leading-none select-none"
        >
          <h1
            className="text-white"
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(72px,14vw,140px)",
              letterSpacing: "0.05em",
            }}
          >
            CHAPTER
          </h1>
        </motion.div>

        {/* Date + location */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-xs tracking-[0.4em] uppercase"
          style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)" }}
        >
          04 de Julho · 22h · A definir · Brasília
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="flex items-end gap-6"
        >
          <Pad n={dias} label="dias" />
          <span className="text-3xl mb-4" style={{ color: GOLD, fontFamily: "var(--font-bebas)" }}>:</span>
          <Pad n={hrs}  label="hrs"  />
          <span className="text-3xl mb-4" style={{ color: GOLD, fontFamily: "var(--font-bebas)" }}>:</span>
          <Pad n={min}  label="min"  />
        </motion.div>

        {/* Perks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "rgba(168,255,120,0.6)" }}
        >
          {["Open Bar", "Área VIP"].map((p, i) => (
            <span key={p} className="flex items-center gap-4">
              {p}
              {i < 1 && <span style={{ color: "rgba(168,255,120,0.3)" }}>·</span>}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.95 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
        >
          {esgotado ? (
            <span
              className="w-full py-3.5 text-center text-xs tracking-widest uppercase border cursor-not-allowed"
              style={{ borderColor: "rgba(168,255,120,0.3)", color: "rgba(201,169,110,0.4)" }}
            >
              Esgotado
            </span>
          ) : (
            <>
              <Link
                href="/ingressos"
                className="flex-1 py-3.5 text-center text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
                style={{
                  background: GOLD,
                  color: "#0a0a0a",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                }}
              >
                Garantir ingresso
              </Link>
              <Link
                href="#lotes"
                className="flex-1 py-3.5 text-center text-xs tracking-widest uppercase border transition-colors hover:bg-white/5"
                style={{
                  borderColor: "rgba(168,255,120,0.5)",
                  color: GOLD,
                  fontFamily: "var(--font-inter)",
                }}
              >
                Ver lotes
              </Link>
            </>
          )}
        </motion.div>

      </div>
    </section>
  );
}
