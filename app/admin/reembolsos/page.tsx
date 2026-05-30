import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import ReembolsosClient from "./ReembolsosClient";

export const revalidate = 0;

type IngressoReembolso = {
  id: string;
  nome: string;
  email: string;
  categoria: string;
  preco: number;
  reembolso_chave_pix: string | null;
  reembolso_solicitado_em: string | null;
  reembolso_pago: boolean;
  reembolso_pago_em: string | null;
  status: string;
  lotes: { numero: number } | null;
};

export default async function AdminReembolsosPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");
  if (auth?.value !== "true") redirect("/admin/login");

  const { data, error } = await supabaseAdmin
    .from("ingressos")
    .select("id, nome, email, categoria, preco, reembolso_chave_pix, reembolso_solicitado_em, reembolso_pago, reembolso_pago_em, status, lotes(numero)")
    .eq("reembolso_solicitado", true)
    .order("reembolso_solicitado_em", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0f0d] text-white flex items-center justify-center">
        <p className="text-red-400 text-sm">{error.message}</p>
      </main>
    );
  }

  const reembolsos = (data ?? []) as unknown as IngressoReembolso[];
  const pendentes = reembolsos.filter((r) => !r.reembolso_pago);
  const processados = reembolsos.filter((r) => r.reembolso_pago);

  return <ReembolsosClient pendentes={pendentes} processados={processados} />;
}
