"use client";

import { motion, type Easing } from "framer-motion";
import Link from "next/link";
import { LampContainer } from "@/components/ui/lamp";

const EASE: Easing = "easeOut";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
});

interface Props {
  vagasTotal: number;
  esgotado: boolean;
  precoF?: number;
  precoM?: number;
}

export default function HeroAnimado({ vagasTotal, esgotado, precoF, precoM }: Props) {
  return (
    <LampContainer>
      <div className="flex flex-col items-center text-center gap-5 w-full max-w-4xl">
        {/* Eyebrow */}
        <motion.p
          {...fade(0.2)}
          className="text-xs tracking-[0.45em] text-zinc-500 uppercase font-[family-name:var(--font-inter)]"
        >
          Uma noite. Um capítulo.
        </motion.p>

        {/* Title */}
        <motion.h1
          {...fade(0.4)}
          className="font-[family-name:var(--font-playfair)] leading-none select-none"
          style={{ fontSize: "clamp(5rem,16vw,9rem)" }}
        >
          <span className="text-white">CHAP</span>
          <span
            style={{
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(255,255,255,0.5)",
            }}
          >
            T
          </span>
          <span className="text-white">ER</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fade(0.5)}
          className="text-zinc-400 text-sm tracking-widest uppercase font-[family-name:var(--font-inter)]"
        >
          Lago Sul · QI 11 Conjunto 10 · Brasília
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="w-px h-12 bg-zinc-700 origin-top"
        />

        {/* Info row */}
        <motion.div
          {...fade(0.7)}
          className="flex items-center justify-center gap-8 font-[family-name:var(--font-inter)]"
        >
          <div className="text-center">
            <p className="text-zinc-600 text-[10px] tracking-widest uppercase mb-1">Data</p>
            <p className="text-white text-sm">01 · AGO · 2026</p>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <p className="text-zinc-600 text-[10px] tracking-widest uppercase mb-1">Local</p>
            <p className="text-white text-sm">Lago Sul</p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div {...fade(0.8)} className="mt-2">
          {esgotado ? (
            <span className="px-10 py-3 border border-zinc-800 text-sm tracking-widest uppercase text-zinc-700 cursor-not-allowed font-[family-name:var(--font-inter)]">
              Esgotado
            </span>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Link
                href="/comprar"
                className="inline-block px-10 py-3 border border-white text-sm tracking-widest uppercase text-white hover:bg-white hover:text-black transition-colors duration-200 font-[family-name:var(--font-inter)]"
              >
                Garantir Vaga
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </LampContainer>
  );
}
