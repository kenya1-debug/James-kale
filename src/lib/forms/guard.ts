import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { supabasePublic as db } from "@/lib/supabase/public";
import { serverEnv } from "@/lib/env.server";

export async function getClientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Returns true when the request is allowed. Fails OPEN if the database call itself errors. */
export async function allowRequest(action: string, limit: number, windowSeconds: number) {
  const ip = await getClientIp();
  const hash = createHash("sha256")
    .update(`${serverEnv.RATE_LIMIT_SALT ?? "kale"}:${ip}`)
    .digest("hex")
    .slice(0, 32);
  const { data, error } = await db.rpc("hit_rate_limit", {
    p_key: `${action}:${hash}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] rpc failed:", error.code);
    return true;
  }
  return data === true;
}

/** Honeypot field filled, or the form was submitted implausibly fast. */
export function looksLikeBot(fd: FormData) {
  const honey = fd.get("website");
  if (typeof honey === "string" && honey.trim() !== "") return true;
  const elapsed = Number(fd.get("elapsedMs"));
  return !Number.isFinite(elapsed) || elapsed < 2500;
}

/** Passes when Turnstile isn't configured. */
export async function verifyTurnstile(token: string) {
  const secret = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const ip = await getClientIp();
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    console.error("[turnstile] verification request failed");
    return false;
  }
}

export const field = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};
