import BuyerDashboard from "@/components/buyer/BuyerDashboard";
import type { Viewport } from "next";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function BuyerPage() {
  const profile = await requireProfile("comprador");
  return <BuyerDashboard name={profile.name} />;
}

export const viewport: Viewport = { themeColor: "#f5f8fa" };
