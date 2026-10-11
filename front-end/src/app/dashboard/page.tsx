import BuyerDashboard from "@/components/buyer/BuyerDashboard";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function BuyerPage() {
  const profile = await requireProfile("comprador");
  return <BuyerDashboard name={profile.name} />;
}
