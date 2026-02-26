import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Focus Club Vallecas - Centro Premium de Bienestar",
  description: "Centro premium de bienestar y transformación física en Vallecas. Entrenamiento personalizado, fisioterapia deportiva, pilates y nutrición.",
  keywords: ["Focus Club", "Vallecas", "fitness", "entrenamiento personal", "fisioterapia", "pilates", "bienestar", "Madrid"],
  authors: [{ name: "Focus Club Vallecas" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Focus Club Vallecas - Centro Premium de Bienestar",
    description: "Centro premium de bienestar y transformación física en Vallecas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Focus Club Vallecas",
    description: "Centro premium de bienestar y transformación física en Vallecas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Providers>
          <Navbar />
          <main className="flex-1 pt-20">
            {children}
          </main>
          <Footer />
          <FloatingWhatsApp />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
