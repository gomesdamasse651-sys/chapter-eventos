import { getLoteAtivo } from "@/lib/lotes";
import IngressosClient from "./IngressosClient";

export default async function IngressosPage() {
  const lote = await getLoteAtivo();
  return <IngressosClient lote={lote} />;
}
