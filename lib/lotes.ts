import { supabaseAdmin } from "@/lib/supabase";

export type Categoria = "masc_normal" | "fem_normal" | "masc_vip" | "fem_vip";

export type Lote = {
  id: string;
  numero: number;
  nome: string;
  status: "ativo" | "fechado" | "esgotado";
  forcado_admin: boolean;
  masc_normal_total: number;
  masc_normal_vendidos: number;
  masc_normal_preco: number;
  fem_normal_total: number;
  fem_normal_vendidos: number;
  fem_normal_preco: number;
  masc_vip_total: number;
  masc_vip_vendidos: number;
  masc_vip_preco: number;
  fem_vip_total: number;
  fem_vip_vendidos: number;
  fem_vip_preco: number;
  created_at: string;
};

export async function getLoteAtivo(): Promise<Lote | null> {
  const { data, error } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .eq("status", "ativo")
    .order("numero", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Lote;
}

export async function getLotesAdmin(): Promise<Lote[]> {
  const { data, error } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .order("numero", { ascending: true });

  if (error || !data) return [];
  return data as Lote[];
}

export async function avancarLote(loteId: string, numero: number): Promise<void> {
  await supabaseAdmin
    .from("lotes")
    .update({ status: "esgotado" })
    .eq("id", loteId);

  await supabaseAdmin
    .from("lotes")
    .update({ status: "ativo" })
    .eq("numero", numero + 1)
    .eq("forcado_admin", false);
}

export async function forcarStatus(
  loteId: string,
  novoStatus: "ativo" | "fechado"
): Promise<void> {
  await supabaseAdmin
    .from("lotes")
    .update({ status: novoStatus, forcado_admin: true })
    .eq("id", loteId);
}

export async function incrementarVendido(
  loteId: string,
  categoria: Categoria
): Promise<void> {
  const coluna = `${categoria}_vendidos`;

  await supabaseAdmin.rpc("incrementar_vendido", {
    lote_id: loteId,
    coluna,
  });

  const { data: lote } = await supabaseAdmin
    .from("lotes")
    .select("*")
    .eq("id", loteId)
    .single();

  if (!lote) return;

  const esgotado =
    lote.masc_normal_vendidos >= lote.masc_normal_total &&
    lote.fem_normal_vendidos >= lote.fem_normal_total &&
    lote.masc_vip_vendidos >= lote.masc_vip_total &&
    lote.fem_vip_vendidos >= lote.fem_vip_total;

  if (esgotado && !lote.forcado_admin) {
    await avancarLote(loteId, lote.numero);
  }
}
