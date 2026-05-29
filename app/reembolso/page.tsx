import Link from "next/link";

export const metadata = { title: "Cancelamento e Reembolso — Chapter" };

export default function Reembolso() {
  return (
    <main className="min-h-screen bg-[#080808] text-white px-6 py-16 max-w-2xl mx-auto flex flex-col gap-8">
      <Link href="/" className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors">← Voltar</Link>
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs tracking-widest uppercase">Legal</p>
        <h1 className="text-3xl font-light" style={{ fontFamily: "var(--font-playfair)" }}>Cancelamento e Reembolso</h1>
      </div>
      <div className="flex flex-col gap-6 text-zinc-400 text-sm leading-relaxed">
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Política geral</h2>
          <p>Ingressos não são reembolsáveis após a confirmação do pagamento, salvo em caso de cancelamento do evento pelos organizadores.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Seguro Reembolsável</h2>
          <p>Ao adquirir o Seguro Reembolsável (R$ 11,90 por ingresso), você garante o direito ao reembolso integral do valor do ingresso caso não possa comparecer ao evento, mediante solicitação com até 48 horas de antecedência.</p>
          <p>O valor do seguro em si não é reembolsável.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Cancelamento do evento</h2>
          <p>Em caso de cancelamento total do evento, todos os compradores serão reembolsados integralmente, incluindo o valor do seguro.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Contato</h2>
          <p>Para solicitar reembolso: <a href="mailto:contato@chapterbrasilia.com" className="text-white hover:underline">contato@chapterbrasilia.com</a></p>
        </section>
      </div>
    </main>
  );
}
