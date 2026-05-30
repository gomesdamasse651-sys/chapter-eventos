"use server";

import { forcarStatus } from "@/lib/lotes";
import { revalidatePath } from "next/cache";

export async function forcarAbrirLote(loteId: number) {
  await forcarStatus(loteId, true);
  revalidatePath("/admin/lotes");
}

export async function forcarFecharLote(loteId: number) {
  await forcarStatus(loteId, false);
  revalidatePath("/admin/lotes");
}
