import { getCity } from "@/lib/cities";
import { esc, sendEmail } from "@/lib/email";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PLACES_INBOX = "places@livingcollective.net";

const MAPS = /^https:\/\/((www\.)?google\.[a-z.]{2,8}\/maps|maps\.google\.[a-z.]{2,8}|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

// "What are you suggesting?" form: a restaurant or masjid, by Google Maps link or by name and area.
// Saved to contact_submissions and emailed to places@livingcollective.net (reply goes to the person who suggested it).
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (typeof body.company === "string" && body.company.trim()) return Response.json({ ok: true });

  const topic = body.type === "mas" ? "masjid" : "restaurant";
  const maps = String(body.maps ?? "").trim().slice(0, 2000);
  const name = String(body.name ?? "").trim().slice(0, 80);
  const area = String(body.area ?? "").trim().slice(0, 120);
  const you = String(body.you ?? "").trim().slice(0, 60);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 120);
  const facilities = Array.isArray(body.facilities) ? body.facilities.filter((x): x is string => typeof x === "string").slice(0, 6) : [];
  const city = getCity(String(body.city ?? "").trim());
  const hasMaps = MAPS.test(maps);
  if ((!hasMaps && !name) || !you || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ ok: false }, { status: 400 });

  const lines = [`City: ${city?.name ?? "Unknown"}`];
  if (hasMaps) lines.push(`Google Maps: ${maps}`);
  if (name) lines.push(`Name: ${name}`);
  if (area) lines.push(`Area: ${area}`);
  if (facilities.length) lines.push(`Facilities: ${facilities.join(", ")}`);

  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic,
    name: you,
    email,
    subject: `Suggestion: ${name || maps}`,
    body: lines.join("\n"),
  });
  if (error) return Response.json({ ok: false }, { status: 500 });

  const kind = topic === "masjid" ? "masjid" : "restaurant";
  const what = name || "a place on Google Maps";
  const rows: [string, string][] = [["Type", kind === "masjid" ? "Masjid" : "Restaurant"], ["City", city?.name ?? "Unknown"]];
  if (name) rows.push(["Name", name]);
  if (area) rows.push(["Area", area]);
  if (hasMaps) rows.push(["Google Maps", maps]);
  if (facilities.length) rows.push(["Facilities", facilities.join(", ")]);
  rows.push(["Suggested by", `${you} <${email}>`]);
  const cell = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6b736e;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${
      k === "Google Maps" ? `<a href="${esc(v)}">${esc(v)}</a>` : esc(v)
    }</td></tr>`;
  const sent = await sendEmail({
    to: PLACES_INBOX,
    replyTo: email,
    subject: `New ${kind} suggestion: ${what}${city ? ` (${city.name})` : ""}`,
    text: [`New ${kind} suggestion on Halal Living`, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Reply to this email to answer the person who suggested it."].join("\n"),
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:#1f2a24"><p style="font-size:18px;font-weight:700;margin:0 0 12px">New ${kind} suggestion on Halal Living</p><table cellpadding="0" cellspacing="0">${rows.map(([k, v]) => cell(k, v)).join("")}</table><p style="color:#6b736e;font-size:13px;margin-top:16px">Reply to this email to answer the person who suggested it.</p></div>`,
  });
  if (!sent.ok) console.error("suggestion email failed:", sent.error);
  return Response.json({ ok: true });
}
