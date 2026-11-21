import type { Metadata, Viewport } from "next";
import HomePage from "@/components/home/HomePage";

export const metadata: Metadata = {
  title: "LockBox · Compra en vivo, recoge con confianza",
  description:
    "Compra y vende con pagos en garantía y retiro con QR en una red de tiendas aliadas de La Paz.",
};

export const viewport: Viewport = { themeColor: "#f5f8fa" };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string | string[] }>;
}) {
  const { perfil } = await searchParams;
  const role =
    perfil === "comprador" ||
    perfil === "vendedor" ||
    perfil === "operador_punto"
      ? perfil
      : null;
  return <HomePage role={role} />;
}
