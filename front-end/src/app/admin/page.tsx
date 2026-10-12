import Link from "next/link";
import PointDashboard from "@/components/collection-point/PointDashboard";
import { requirePointProfile } from "@/lib/auth/require-profile";

export default async function AdminPage() {
  const profile = await requirePointProfile();
  if (!profile.allowed)
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold">Punto de recojo sin asignar</h1>
        <p className="my-4 text-text-secondary">
          Tu cuenta no tiene un punto activo asignado. Solicita al equipo de
          LockBox que te asigne como responsable.
        </p>
        <Link href="/" className="text-accent">
          Volver al inicio
        </Link>
      </main>
    );
  return <PointDashboard name={profile.name} />;
}
