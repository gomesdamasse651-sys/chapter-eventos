import Link from "next/link";

export const metadata = { title: "Suporte — Chapter" };

export default function Suporte() {
  return (
    <main className="min-h-screen bg-[#080808] text-white px-6 py-16 max-w-2xl mx-auto flex flex-col gap-8">
      <Link href="/" className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors">← Voltar</Link>
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs tracking-widest uppercase">Ajuda</p>
        <h1 className="text-3xl font-light" style={{ fontFamily: "var(--font-playfair)" }}>Suporte</h1>
      </div>
      <div className="flex flex-col gap-6 text-zinc-400 text-sm leading-relaxed">
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Contato</h2>
          <p>Para dúvidas sobre ingressos, pagamentos ou o evento, entre em contato pelo email:</p>
          <a href="mailto:contato@chapterbrasilia.com" className="text-white text-base tracking-wide hover:underline">
            contato@chapterbrasilia.com
          </a>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Não recebi meu ingresso</h2>
          <p>Após a confirmação do pagamento, o ingresso fica disponível na sua conta em /dashboard. Verifique também a pasta de spam do seu email.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Problemas com pagamento</h2>
          <p>O processamento é feito pela InfinitePay. Em caso de cobrança indevida, entre em contato imediatamente pelo email acima.</p>
        </section>
      </div>
    </main>
  );
}
