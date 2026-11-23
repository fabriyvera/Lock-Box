import { requireProfile } from "@/lib/auth/require-profile";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = { title: "Administración | LockBox" };

export default async function AdminPage() {
  const profile = await requireProfile("admin");
  return <AdminDashboard name={profile.name} />;
}
