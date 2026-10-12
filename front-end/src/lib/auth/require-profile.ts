import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AccountRole } from "./account";

export async function requireProfile(role: AccountRole) {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,username,full_name,role,is_active")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.is_active) redirect("/login?error=profile");
  if (profile.role !== role) {
    if (profile.role === "vendedor") redirect("/vendedor");
    if (profile.role === "comprador") redirect("/dashboard");
    if (profile.role === "admin" || profile.role === "despachador")
      redirect("/admin");
    redirect("/login?error=role");
  }
  return {
    name: profile.full_name || profile.username,
    username: profile.username,
  };
}

export async function requirePointProfile() {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,username,full_name,role,is_active")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.is_active) redirect("/login?error=profile");
  const { data: points, error: pointsError } = await client
    .from("lockbox_points")
    .select("id")
    .eq("manager_id", user.id)
    .eq("is_active", true)
    .limit(1);
  return {
    name: profile.full_name || profile.username,
    allowed: profile.role === "admin" || (!pointsError && !!points?.length),
  };
}
