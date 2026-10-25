"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { done, fail, type ActionState } from "@/lib/admin/result";

export async function saveStaff(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const p = z
    .object({ id: z.uuid(), full_name: z.string().trim().max(100), role: z.enum(["admin", "staff"]) })
    .safeParse({ id: String(fd.get("id") ?? ""), full_name: String(fd.get("full_name") ?? ""), role: String(fd.get("role") ?? "") });
  if (!p.success) return fail("Please check the name and role.");
  const is_active = fd.get("is_active") === "on";

  // Prevent locking yourself out
  if (p.data.id === me.id && (!is_active || p.data.role !== "admin")) return fail("You cannot deactivate yourself or remove your own admin role.");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: p.data.full_name || null, role: p.data.role, is_active }).eq("id", p.data.id);
  if (error) return fail("Could not save. Please try again.");
  return done();
}
