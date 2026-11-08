import { readEnv } from "./supabase.ts";

// Transactional email through Resend (https://resend.com). The API key is the RESEND_API_KEY Worker secret, never config.
// Sends from updates@halal.livingcollective.net: the halal.livingcollective.net domain in Resend (DKIM + SPF records in the livingcollective.net zone).

export const EMAIL_FROM = "Halal Living <updates@halal.livingcollective.net>";

export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string; headers?: Record<string, string> };

const payload = (mail: Mail) => ({
  from: EMAIL_FROM,
  to: [mail.to],
  subject: mail.subject,
  html: mail.html,
  text: mail.text,
  ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
  ...(mail.headers ? { headers: mail.headers } : {}),
});

async function post(path: string, body: unknown, idempotencyKey?: string): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const key = await readEnv("RESEND_API_KEY");
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };
  try {
    const response = await fetch(`https://api.resend.com${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}) },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) return { ok: false, error: data.message || `Resend ${response.status}` };
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "send failed" };
  }
}

export async function sendEmail(mail: Mail): Promise<{ ok: boolean; id?: string; error?: string }> {
  const sent = await post("/emails", payload(mail));
  return { ok: sent.ok, id: (sent.data as { id?: string } | undefined)?.id, error: sent.error };
}

/** Up to 100 emails in one request. The idempotency key stops a retried cron run from sending twice. */
export async function sendBatch(mails: Mail[], idempotencyKey?: string): Promise<{ ok: boolean; error?: string }> {
  if (!mails.length) return { ok: true };
  const sent = await post("/emails/batch", mails.map(payload), idempotencyKey);
  return { ok: sent.ok, error: sent.error };
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : (items[0] ?? ""));

/** "You're subscribed" confirmation for the Stay updated monthly digest. */
export function subscribeEmail(opts: { name: string; cities: { name: string; slug: string }[]; topics: string[]; site: string; unsubscribe?: string }) {
  const cityNames = list(opts.cities.map((c) => c.name));
  const topics = list(opts.topics.map((t) => t.toLowerCase()));
  const hello = opts.name ? `Assalamu alaikum ${opts.name},` : "Assalamu alaikum,";
  const links = opts.cities.map((c) => ({ name: c.name, url: `${opts.site}/${c.slug}` }));
  const subject = `You're subscribed to Halal Living ${cityNames}`;
  const text = [
    hello,
    "",
    `Thanks for subscribing. Once a month, on the 1st, we'll email you the ${topics} added in ${cityNames}.`,
    "",
    ...links.map((l) => `${l.name}: ${l.url}`),
    "",
    "Didn't sign up? Just ignore this email and you won't hear from us.",
    "",
    "Halal Living",
    ...(opts.unsubscribe ? ["", `Unsubscribe: ${opts.unsubscribe}`] : []),
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2a24">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ec;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#2f6b4f;font-weight:700;padding-bottom:16px">Halal Living</td></tr>
<tr><td style="font-size:22px;line-height:1.3;font-weight:700;padding-bottom:16px">You're subscribed</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:12px">${esc(hello)}</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:24px">Thanks for subscribing. Once a month, on the 1st, we'll email you the ${esc(topics)} added in ${esc(cityNames)}.</td></tr>
<tr><td style="padding-bottom:24px">${links.map((l) => `<a href="${esc(l.url)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;border-radius:999px;background:#2f6b4f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px">Open ${esc(l.name)}</a>`).join("")}</td></tr>
<tr><td style="font-size:13px;line-height:1.6;color:#6b736e;border-top:1px solid #ece7dc;padding-top:16px">Didn't sign up? Just ignore this email and you won't hear from us.${opts.unsubscribe ? ` <a href="${esc(opts.unsubscribe)}" style="color:#6b736e">Unsubscribe</a>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text };
}
