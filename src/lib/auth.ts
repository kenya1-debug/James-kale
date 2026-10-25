import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffProfile = {
  id: string;
  full_name: string | null;
  role: "admin" | "staff";
  email?: string;
};

/** Verified, active staff profile for the current request, or null. Cached per request. */
export const getStaffProfile = cache(async (): Promise<StaffProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || !profile.is_active) return null;
  return {
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    email: typeof data?.claims?.email === "string" ? data.claims.email : undefined,
  };
});

/**
 * Call at the top of EVERY admin page, route handler and server action.
 * Layouts do not re-run on client navigation and proxy.ts does not guard server actions,
 * so each entry point must verify the session itself.
 */
export async function requireStaff(): Promise<StaffProfile> {
  const me = await getStaffProfile();
  if (!me) redirect("/admin/login");
  return me;
}

export async function requireAdmin(): Promise<StaffProfile> {
  const me = await requireStaff();
  if (me.role !== "admin") redirect("/admin?error=forbidden");
  return me;
}
