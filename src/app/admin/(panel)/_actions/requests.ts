"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { done, fail, type ActionState } from "@/lib/admin/result";

const schema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "contacted", "scheduled", "closed"]),
  admin_notes: z.string().max(4000),
});

async function update(table: "consultations" | "contact_messages", fd: FormData): Promise<ActionState> {
  await requireStaff();
  const p = schema.safeParse({ id: fd.get("id"), status: fd.get("status"), admin_notes: String(fd.get("admin_notes") ?? "") });
  if (!p.success) return fail("Please check the status and notes.");
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ status: p.data.status, admin_notes: p.data.admin_notes.trim() || null })
    .eq("id", p.data.id);
  if (error) return fail("Could not save. Please try again.");
  revalidatePath("/admin", "layout");
  return done("Saved.");
}

export async function updateConsultation(_p: ActionState, fd: FormData) {
  return update("consultations", fd);
}
export async function updateMessage(_p: ActionState, fd: FormData) {
  return update("contact_messages", fd);
}

async function remove(table: "consultations" | "contact_messages", fd: FormData, back: string) {
  await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from(table).delete().eq("id", id.data);
  revalidatePath("/admin", "layout");
  redirect(back);
}

export async function deleteConsultation(fd: FormData) {
  return remove("consultations", fd, "/admin/consultations");
}
export async function deleteMessage(fd: FormData) {
  return remove("contact_messages", fd, "/admin/messages");
}
