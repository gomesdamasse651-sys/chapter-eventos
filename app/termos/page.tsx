import Link from "next/link";

export const metadata = { title: "Termos de Uso — Chapter" };

export default function Termos() {
  return (
    <main className="min-h-screen bg-[#080808] text-white px-6 py-16 max-w-2xl mx-auto flex flex-col gap-8">
      <Link href="/" className="text-zinc-600 text-xs tracking-widest uppercase hover:text-white transition-colors">← Voltar</Link>
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-xs tracking-widest uppercase">Legal</p>
        <h1 className="text-3xl font-light" style={{ fontFamily: "var(--font-playfair)" }}>Termos de Uso</h1>
      </div>
      <div className="flex flex-col gap-6 text-zinc-400 text-sm leading-relaxed">
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">1. Aceitação</h2>
          <p>Ao adquirir um ingresso para o evento CHAPTER, você concorda com estes termos. O evento está sujeito a cancelamento ou alteração de data por motivos de força maior.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">2. Ingressos</h2>
          <p>Cada ingresso é nominal e intransferível. O QR code de acesso será enviado por email após confirmação do pagamento. A entrada só será permitida mediante apresentação do QR code válido.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">3. Conduta</h2>
          <p>É proibida a entrada de menores de 18 anos. Os organizadores reservam-se o direito de recusar entrada a qualquer pessoa sem aviso prévio.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">4. Responsabilidade</h2>
          <p>Os organizadores não se responsabilizam por objetos perdidos ou roubados durante o evento.</p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-white text-xs tracking-widest uppercase">5. Contato</h2>
          <p>Dúvidas: <a href="mailto:empresadamasse651@gmail.com" className="text-white hover:underline">empresadamasse651@gmail.com</a></p>
        </section>
      </div>
    </main>
  );
}
