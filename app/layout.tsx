import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Chapter — 01 de Agosto",
  description: "Garanta seu ingresso. Lago Sul · Brasília.",
  openGraph: {
    title: "CHAPTER — 01 de Agosto",
    description: "Garanta seu ingresso. Lago Sul · Brasília.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Chapter — 01 de Agosto" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CHAPTER — 01 de Agosto",
    description: "Garanta seu ingresso. Lago Sul · Brasília.",
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
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080808]">{children}</body>
    </html>
  );
}
