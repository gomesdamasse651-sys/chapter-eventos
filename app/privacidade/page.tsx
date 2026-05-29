import Link from "next/link";

export const metadata = { title: "Privacidade — Chapter" };

export default function Privacidade() {
  return (
    <main className="min-h-screen bg-[#080808] text-white px-6 py-16 max-w-2xl mx-auto flex flex-col gap-8">
      <Link href="/" className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors">← Voltar</Link>
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs tracking-widest uppercase">Legal</p>
        <h1 className="text-3xl font-light" style={{ fontFamily: "var(--font-playfair)" }}>Política de Privacidade</h1>
      </div>
      <div className="flex flex-col gap-6 text-zinc-400 text-sm leading-relaxed">
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Dados coletados</h2>
          <p>Coletamos nome, email e telefone para fins de identificação e emissão do ingresso. Esses dados não são compartilhados com terceiros além do necessário para processamento do pagamento.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Pagamento</h2>
          <p>O processamento de pagamento é realizado pela InfinitePay. Não armazenamos dados de cartão de crédito.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Cookies</h2>
          <p>Utilizamos cookies para autenticação e manutenção de sessão. Nenhum cookie de rastreamento de terceiros é utilizado.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">Seus direitos</h2>
          <p>Você pode solicitar a exclusão dos seus dados a qualquer momento pelo email <a href="mailto:contato@chapterbrasilia.com" className="text-white hover:underline">contato@chapterbrasilia.com</a>.</p>
        </section>
      </div>
    </main>
  );
}
