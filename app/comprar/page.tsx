import { supabaseAdmin } from "@/lib/supabase";
import type { Lote, Categoria } from "@/lib/lotes";
import CheckoutForm from "./CheckoutForm";
import Link from "next/link";
import { redirect } from "next/navigation";

const CATEGORIAS_VALIDAS: Categoria[] = [
  "masc_normal",
  "fem_normal",
  "masc_vip",
  "fem_vip",
];

function categoriaLabel(cat: Categoria): string {
  const map: Record<Categoria, string> = {
    masc_normal: "Masculino — Normal",
    fem_normal: "Feminino — Normal",
    masc_vip: "Masculino — VIP",
    fem_vip: "Feminino — VIP",
  };
  return map[cat];
}

interface Props {
  searchParams: Promise<{ lote_id?: string; categoria?: string }>;
}

export default async function ComprarPage({ searchParams }: Props) {
  const { lote_id, categoria } = await searchParams;

  if (!lote_id || !categoria || !CATEGORIAS_VALIDAS.includes(categoria as Categoria)) {
    redirect("/");
  }

  const cat = categoria as Categoria;

  const { data: lote, error } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .eq("id", lote_id)
    .eq("status", "ativo")
    .single();

  if (error || !lote) {
    redirect("/");
  }

  const l = lote as Lote;
  const vendidos = l[`${cat}_vendidos`] as number;
  const total = l[`${cat}_total`] as number;
  const preco = l[`${cat}_preco`] as number;

  if (vendidos >= total) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-md flex flex-col gap-8">
        <Link
          href="/"
          className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Voltar
        </Link>

        <div>
          <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-2">Ingresso</p>
          <h1 className="text-4xl font-bold tracking-tighter">CHAPTER TWO</h1>
          <p className="text-zinc-500 text-sm mt-1">01 de Agosto · Lago Sul</p>
          <p className="text-zinc-600 text-xs mt-1 tracking-widest uppercase">
            Lote {l.numero}
          </p>
        </div>

        <div className="border border-zinc-800 p-4 flex flex-col gap-1">
          <p className="text-xs tracking-widest uppercase text-zinc-500">Categoria selecionada</p>
          <p className="text-white text-sm">{categoriaLabel(cat)}</p>
          <p className="text-zinc-400 text-sm">
            R$ {preco.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-zinc-700 text-xs">
            {total - vendidos} vaga{total - vendidos !== 1 ? "s" : ""} disponível{total - vendidos !== 1 ? "is" : ""}
          </p>
        </div>

        <CheckoutForm
          loteId={String(l.id)}
          categoria={cat}
          categoriaLabel={categoriaLabel(cat)}
          precoReais={preco}
          loteNumero={l.numero}
        />
      </div>
    </main>
  );
}
