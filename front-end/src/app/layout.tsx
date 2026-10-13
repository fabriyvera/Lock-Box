import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LockBox · Comercio Social Seguro",
  description:
    "Plataforma Phygital para vendedores de TikTok Live con pagos en garantía y entrega verificada por QR.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
