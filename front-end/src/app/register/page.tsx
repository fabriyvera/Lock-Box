import type { Viewport } from "next";
import AuthShell, { parseRole } from "@/components/auth/AuthShell";
import RegistrationForm from "@/components/auth/RegistrationForm";
export const viewport: Viewport = { themeColor: "#f5f8fa" };
export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string | string[] }>;
}) {
  const role = parseRole((await searchParams).perfil) ?? "vendedor";
  return (
    <AuthShell mode="register" role={role}>
      <RegistrationForm key={role} role={role} headingLevel={2} />
    </AuthShell>
  );
}
