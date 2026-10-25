import "server-only";
import { z } from "zod";

// Empty strings in .env.local are treated as "not set"
const opt = z.string().optional().transform((v) => v?.trim() || undefined);

export const serverEnv = z
  .object({
    RESEND_API_KEY: opt,
    NOTIFY_EMAIL_TO: opt,
    NOTIFY_EMAIL_FROM: opt,
    SEND_CLIENT_CONFIRMATION: opt,
    EMAIL_INCLUDE_DETAILS: opt,
    TURNSTILE_SECRET_KEY: opt,
    RATE_LIMIT_SALT: opt,
  })
  .parse(process.env);
