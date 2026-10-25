import "server-only";
import { serverEnv } from "@/lib/env.server";
import { publicEnv } from "@/lib/env";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").slice(0, 120);

async function send(opts: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  const key = serverEnv.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set; skipping email");
    return false;
  }
  const from = serverEnv.NOTIFY_EMAIL_FROM ?? "onboarding@resend.dev";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from.includes("<") ? from : `James Kale & Co. Advocates <${from}>`,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      // Log the status only: never log message bodies or personal data
      console.error("[email] Resend responded", res.status);
      return false;
    }
    return true;
  } catch {
    console.error("[email] request to Resend failed");
    return false;
  }
}

function wrap(title: string, rows: [string, string][], footer: string) {
  const tr = rows
    .map(([k, v]) => `<tr><td style="padding:8px 16px 8px 0;color:#6b6b6b;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;color:#1b1f1d">${esc(v)}</td></tr>`)
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2 style="font-family:Georgia,serif;color:#17382c">${esc(title)}</h2><table style="border-collapse:collapse;font-size:15px">${tr}</table><p style="margin-top:24px;font-size:13px;color:#6b6b6b">${footer}</p></div>`;
}

const adminUrl = () => `${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/admin`;

export type ConsultationEmail = {
  reference: string;
  fullName: string;
  phone: string;
  email: string;
  areaTitle: string;
  dateLabel: string;
  time: string;
  description: string;
};

export async function notifyConsultation(c: ConsultationEmail) {
  const to = serverEnv.NOTIFY_EMAIL_TO;
  if (to) {
    const rows: [string, string][] = [
      ["Reference", c.reference],
      ["Name", c.fullName],
      ["Phone", c.phone],
      ["Email", c.email || "not given"],
      ["Practice area", c.areaTitle],
      ["Requested", `${c.dateLabel}, ${c.time}`],
    ];
    if (serverEnv.EMAIL_INCLUDE_DETAILS === "true") rows.push(["Matter", c.description]);
    const footer =
      serverEnv.EMAIL_INCLUDE_DETAILS === "true"
        ? `Manage this request in the <a href="${adminUrl()}">admin dashboard</a>.`
        : `For confidentiality the description is not included in this email. Read it in the <a href="${adminUrl()}">admin dashboard</a>.`;
    await send({
      to,
      subject: `New consultation request: ${oneLine(c.fullName)} (${oneLine(c.areaTitle)})`,
      html: wrap("New consultation request", rows, footer),
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nDashboard: ${adminUrl()}`,
      replyTo: c.email || undefined,
    });
  }

  // Receipt to the client: only once the sending domain is verified in Resend
  if (serverEnv.SEND_CLIENT_CONFIRMATION === "true" && c.email) {
    const rows: [string, string][] = [
      ["Reference", c.reference],
      ["Requested time", `${c.dateLabel}, ${c.time} (Kenya time)`],
      ["Practice area", c.areaTitle],
    ];
    await send({
      to: c.email,
      subject: "We received your consultation request",
      html: wrap(
        "We received your request",
        rows,
        "Your appointment is not confirmed until we contact you, usually within one working day. If your matter is urgent, please call our office.",
      ),
      text: `We received your consultation request.\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nYour appointment is not confirmed until we contact you.`,
    });
  }
}

export async function notifyContact(m: { fullName: string; phone: string; email: string; subject: string; message: string }) {
  const to = serverEnv.NOTIFY_EMAIL_TO;
  if (!to) return;
  const rows: [string, string][] = [
    ["Name", m.fullName],
    ["Phone", m.phone || "not given"],
    ["Email", m.email || "not given"],
    ["Subject", m.subject || "none"],
  ];
  if (serverEnv.EMAIL_INCLUDE_DETAILS === "true") rows.push(["Message", m.message]);
  const footer =
    serverEnv.EMAIL_INCLUDE_DETAILS === "true"
      ? `Manage this message in the <a href="${adminUrl()}">admin dashboard</a>.`
      : `For confidentiality the message text is not included in this email. Read it in the <a href="${adminUrl()}">admin dashboard</a>.`;
  await send({
    to,
    subject: `New website message from ${oneLine(m.fullName)}`,
    html: wrap("New contact message", rows, footer),
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nDashboard: ${adminUrl()}`,
    replyTo: m.email || undefined,
  });
}
