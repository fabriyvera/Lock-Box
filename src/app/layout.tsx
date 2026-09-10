import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LockBox - Comercio Social Seguro',
  description: 'Plataforma Phygital para vendedores de TikTok Live con pagos en garantía y entrega verificada por QR.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}