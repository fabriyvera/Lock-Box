import type { Viewport } from "next";
import AuthShell, { parseRole } from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
export const viewport: Viewport = { themeColor: "#f5f8fa" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string | string[] }>;
}) {
  const role = parseRole((await searchParams).perfil);
  return (
    <AuthShell mode="login" role={role}>
      <LoginForm role={role} />
    </AuthShell>
  );
}
