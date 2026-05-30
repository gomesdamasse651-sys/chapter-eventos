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
          className="uppercase font-[family-name:var(--font-inter)] transition-colors"
          style={{
            background: "#c9a96e",
            border: "none",
            color: "#0a0a0a",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "0.15em",
            padding: "10px 24px",
            borderRadius: "2px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#dbbf82")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#c9a96e")}
        >
          Entrar
        </Link>
      </div>
    </motion.nav>
  );
}
