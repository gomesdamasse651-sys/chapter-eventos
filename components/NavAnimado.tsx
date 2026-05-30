"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function NavAnimado() {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
    >
      {/* Logo + nome */}
      <div className="flex items-center gap-3">
        <Logo size={28} />
        <span className="text-[10px] tracking-[0.35em] uppercase text-zinc-400 font-[family-name:var(--font-inter)]">
          Chapter
        </span>
      </div>

      {/* Data + botão entrar */}
      <div className="flex items-center gap-6">
        <span className="hidden sm:block text-[10px] tracking-widest text-zinc-600 font-[family-name:var(--font-inter)] uppercase">
          01 · AGO · 2026
        </span>
        <Link
          href="/login"
          className="text-[10px] uppercase font-[family-name:var(--font-inter)] transition-colors"
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.7)",
            color: "#ffffff",
            fontWeight: 600,
            letterSpacing: "0.1em",
            padding: "8px 20px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        >
          Entrar
        </Link>
      </div>
    </motion.nav>
  );
}
