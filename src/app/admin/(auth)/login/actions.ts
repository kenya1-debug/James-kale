"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

const schema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
  next: z.string().max(300).optional(),
});

// Only allow redirects to admin paths on this site (prevents open redirects)
function safeNext(value: string | undefined) {
  if (value && value.startsWith("/admin") && !value.startsWith("//") && !value.includes("\\")) return value;
  return "/admin";
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  // Generic message: never reveal whether the email exists
  if (error) return { error: "Invalid email or password." };

  redirect(safeNext(parsed.data.next));
}
