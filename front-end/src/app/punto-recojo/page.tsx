import Link from "next/link";
import { MapPin } from "lucide-react";
import PointDashboard from "@/components/collection-point/PointDashboard";
import { requirePointProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "Mi Punto LockBox | LockBox" };

export default async function CollectionPointPage() {
  const profile = await requirePointProfile();
  if (!profile.allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas p-4 text-foreground">
        <section className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 sm:p-8">
          <MapPin size={32} className="mb-4 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Punto de recojo sin asignar</h1>
          <p className="my-4 text-text-secondary">
            Tu cuenta no tiene un punto activo asignado. Si ya registraste un
            punto, contacta al equipo de LockBox para revisar su estado.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-accent"
          >
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }
  return <PointDashboard name={profile.name} />;
}
