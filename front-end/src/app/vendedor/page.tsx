import type { Metadata } from "next";
import SellerDashboard from "@/components/seller/SellerDashboard";
import { requireProfile } from "@/lib/auth/require-profile";

export const metadata: Metadata = {
  title: "Panel del vendedor · LockBox",
  description: "Gestiona tu catálogo, lives y pedidos en LockBox.",
};

export default async function SellerPage() {
  await requireProfile("vendedor");
  return <SellerDashboard />;
}
