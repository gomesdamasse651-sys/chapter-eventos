import type { Metadata } from "next";
import { Playfair_Display, Inter, Bebas_Neue, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  title: "Chapter — 15 de Agosto",
  description: "Garanta seu ingresso. Acadêmicos da Asa Norte · Brasília.",
  openGraph: {
    title: "CHAPTER — 15 de Agosto",
    description: "Garanta seu ingresso. Acadêmicos da Asa Norte · Brasília.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Chapter — 15 de Agosto" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CHAPTER — 15 de Agosto",
    description: "Garanta seu ingresso. Acadêmicos da Asa Norte · Brasília.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${inter.variable} ${bebas.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080808]">{children}</body>
    </html>
  );
}
