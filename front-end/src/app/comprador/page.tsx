import { BuyerDashboard } from "@/components/buyer/BuyerDashboard";
import { requireProfile } from "@/lib/auth/require-profile";

export const metadata = {
  title: "Comprador | LockBox Marketplace",
  description:
    "Catálogo en vivo y pagos protegidos por Escrow en Puntos LockBox La Paz",
};

export default async function BuyerPage() {
  const profile = await requireProfile("comprador");
  return <BuyerDashboard name={profile.name} />;
}
