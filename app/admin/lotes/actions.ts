"use server";

import { forcarStatus } from "@/lib/lotes";
import { revalidatePath } from "next/cache";

export async function forcarAbrirLote(loteId: string) {
  await forcarStatus(loteId, "ativo");
  revalidatePath("/admin/lotes");
}

export async function forcarFecharLote(loteId: string) {
  await forcarStatus(loteId, "fechado");
  revalidatePath("/admin/lotes");
}
