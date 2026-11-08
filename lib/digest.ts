import { CITIES, type CityTheme } from "./cities";
import { esc, sendBatch, type Mail } from "./email";
import { directoryReels, reelPlaces } from "./reel-directory";
import { getSupabase, readEnv } from "./supabase";

// Monthly "Stay updated" digest: for each subscriber, the restaurants and masjids first featured in their cities
// since their last digest. Runs from the Worker's cron (worker/index.ts) on the 1st of each month at 09:00 IST.
// Subscribers live in public.digest_subscribers, reached only through security-definer functions that check
// DIGEST_SECRET (see supabase/migrations/20261108120000_digest_subscribers.sql).

export const SITE = "https://halal.livingcollective.net";

type Kind = "restaurants" | "masjids";
export type NewPlace = { kind: Kind; slug: string; name: string; area: string; cuisine: string; description: string; city: string; firstAt: number };
export type Subscriber = { id: string; email: string; name: string; cities: string[]; restaurants: boolean; masjids: boolean; token: string; since: string };

const reelTime = new Map(directoryReels.map((r) => [r.id, typeof r.publishedAt === "number" ? r.publishedAt * 1000 : 0]));

/** Each place is dated by its earliest reel: that's when it entered the directory. */
const PLACES: NewPlace[] = reelPlaces.map((p) => {
  const times = (p.reelIds as string[]).map((id) => reelTime.get(id) ?? 0).filter((t) => t > 0);
  return {
    kind: p.kind as Kind,
    slug: p.slug,
    name: p.name,
    area: p.area || "",
    cuisine: ("cuisine" in p && typeof p.cuisine === "string" ? p.cuisine : "") || "",
    description: p.description || "",
    city: p.city,
    firstAt: times.length ? Math.min(...times) : 0,
  };
});

export function newPlaces(sub: Pick<Subscriber, "cities" | "restaurants" | "masjids">, since: number, until: number): NewPlace[] {
  return PLACES.filter(
    (p) => p.firstAt > since && p.firstAt <= until && sub.cities.includes(p.city) && ((p.kind === "restaurants" && sub.restaurants) || (p.kind === "masjids" && sub.masjids)),
  ).sort((a, b) => b.firstAt - a.firstAt);
}

export const unsubscribeUrl = (token: string) => `${SITE}/unsubscribe?t=${encodeURIComponent(token)}`;
export const unsubscribeHeaders = (token: string) => ({
  "List-Unsubscribe": `<${SITE}/api/unsubscribe?t=${encodeURIComponent(token)}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

const monthName = (at: Date) => at.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const andList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : (items[0] ?? ""));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function digestEmail(sub: Subscriber, places: NewPlace[], at: Date): Mail {
  const cities = CITIES.filter((c) => sub.cities.includes(c.slug));
  const label = monthName(new Date(at.getTime() - 5 * 86400000)); // the month that just ended
  const r = places.filter((p) => p.kind === "restaurants").length;
  const m = places.filter((p) => p.kind === "masjids").length;
  const counts = [r && plural(r, "restaurant", "restaurants"), m && plural(m, "masjid", "masjids")].filter(Boolean).join(" and ");
  const subject = `New on Halal Living: ${counts} (${label})`;
  const hello = sub.name ? `Assalamu alaikum ${sub.name},` : "Assalamu alaikum,";
  const intro = `Here's what was added to Halal Living in ${andList(cities.map((c) => c.name))} since your last update.`;
  const url = (p: NewPlace) => `${SITE}/${p.city}/${p.kind}/${p.slug}`;
  const meta = (p: NewPlace) => [p.kind === "masjids" ? "Masjid" : p.cuisine || "Restaurant", p.area].filter(Boolean).join(" · ");

  const sections = cities
    .map((city) => ({ city, items: places.filter((p) => p.city === city.slug) }))
    .filter((s) => s.items.length);

  const text = [
    hello,
    "",
    intro,
    "",
    ...sections.flatMap(({ city, items }) => [
      city.name.toUpperCase(),
      ...(["restaurants", "masjids"] as const).flatMap((kind) => {
        const list = items.filter((p) => p.kind === kind);
        return list.length ? [`${kind === "restaurants" ? "New restaurants" : "New masjids"}:`, ...list.map((p) => `- ${p.name} (${meta(p)}): ${url(p)}`)] : [];
      }),
      `See all of ${city.name}: ${SITE}/${city.slug}`,
      "",
    ]),
    "Halal Living",
    "",
    `Unsubscribe: ${unsubscribeUrl(sub.token)}`,
  ].join("\n");

  const card = (p: NewPlace, city: CityTheme) => `<tr><td style="padding:0 0 12px">
<a href="${esc(url(p))}" style="display:block;text-decoration:none;color:#1f2a24;background:${city.tint};border-radius:12px;padding:14px 16px">
<span style="display:block;font-size:16px;font-weight:700;line-height:1.35">${esc(p.name)}</span>
<span style="display:block;font-size:13px;color:#5b635e;padding-top:2px">${esc(meta(p))}</span>
${p.description ? `<span style="display:block;font-size:14px;line-height:1.5;padding-top:6px;color:#3a423d">${esc(p.description.length > 160 ? p.description.slice(0, 157).trimEnd() + "…" : p.description)}</span>` : ""}
</a></td></tr>`;

  const sectionHtml = sections
    .map(({ city, items }) => {
      const groups = (["restaurants", "masjids"] as const)
        .map((kind) => ({ kind, list: items.filter((p) => p.kind === kind) }))
        .filter((g) => g.list.length)
        .map((g) => `<tr><td style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6b736e;font-weight:700;padding:4px 0 10px">${g.kind === "restaurants" ? "New restaurants" : "New masjids"}</td></tr>${g.list.map((p) => card(p, city)).join("")}`)
        .join("");
      return `<tr><td style="padding:12px 0 4px;font-size:20px;font-weight:800;color:${city.btn}">${esc(city.name)}</td></tr>${groups}
<tr><td style="padding:4px 0 20px"><a href="${SITE}/${city.slug}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:${city.btn};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px">See all of ${esc(city.name)}</a></td></tr>`;
    })
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2a24">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ec;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#2f6b4f;font-weight:700;padding-bottom:12px">Halal Living · ${esc(label)}</td></tr>
<tr><td style="font-size:22px;line-height:1.3;font-weight:700;padding-bottom:14px">New this month: ${esc(counts)}</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:6px">${esc(hello)}</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:8px">${esc(intro)}</td></tr>
${sectionHtml}
<tr><td style="font-size:13px;line-height:1.6;color:#6b736e;border-top:1px solid #ece7dc;padding-top:16px">You get this once a month because you signed up for updates on Halal Living. <a href="${esc(unsubscribeUrl(sub.token))}" style="color:#6b736e">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;

  return { to: sub.email, subject, html, text, headers: unsubscribeHeaders(sub.token) };
}

async function secret(): Promise<string> {
  const value = await readEnv("DIGEST_SECRET");
  if (!value) throw new Error("DIGEST_SECRET is not set");
  return value;
}

export async function subscribe(input: { email: string; name: string; cities: string[]; restaurants: boolean; masjids: boolean }): Promise<{ token: string; isNew: boolean } | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("digest_subscribe", {
    p_secret: await secret(),
    p_email: input.email,
    p_name: input.name,
    p_cities: input.cities,
    p_restaurants: input.restaurants,
    p_masjids: input.masjids,
  });
  const row = Array.isArray(data) ? (data[0] as { token: string; is_new: boolean } | undefined) : undefined;
  if (error || !row) {
    console.error("digest_subscribe failed:", error?.message);
    return null;
  }
  return { token: row.token, isNew: row.is_new };
}

export async function unsubscribe(token: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false;
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("digest_unsubscribe", { p_token: token });
  if (error) console.error("digest_unsubscribe failed:", error.message);
  return data === true;
}

export type DigestRun = { at: string; subscribers: number; sent: number; skipped: number; failed: number; dryRun: boolean; preview?: { email: string; subject: string; places: number }[] };

/**
 * Send the digest. `dryRun` builds everything without sending or marking; `to` sends every email to that one
 * address instead (for testing) and does not mark subscribers as sent.
 */
export async function runDigest(opts: { now?: Date; dryRun?: boolean; to?: string } = {}): Promise<DigestRun> {
  const at = opts.now ?? new Date();
  const supabase = await getSupabase();
  const key = await secret();
  const { data, error } = await supabase.rpc("digest_due", { p_secret: key });
  if (error) throw new Error(`digest_due failed: ${error.message}`);
  const subs = (data ?? []) as Subscriber[];

  const mails: { sub: Subscriber; mail: Mail; places: number }[] = [];
  let skipped = 0;
  for (const sub of subs) {
    const places = newPlaces(sub, new Date(sub.since).getTime(), at.getTime());
    if (!places.length) {
      skipped++;
      continue;
    }
    const mail = digestEmail(sub, places, at);
    mails.push({ sub, mail: opts.to ? { ...mail, to: opts.to } : mail, places: places.length });
  }

  const result: DigestRun = { at: at.toISOString(), subscribers: subs.length, sent: 0, skipped, failed: 0, dryRun: Boolean(opts.dryRun) };
  if (opts.dryRun || opts.to) result.preview = mails.map((m) => ({ email: m.sub.email, subject: m.mail.subject, places: m.places }));
  if (opts.dryRun) return result;

  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    const sent = await sendBatch(chunk.map((m) => m.mail), `digest-${at.toISOString().slice(0, 7)}-${i}${opts.to ? "-test-" + at.getTime() : ""}`);
    if (!sent.ok) {
      result.failed += chunk.length;
      console.error("digest batch failed:", sent.error);
      continue;
    }
    result.sent += chunk.length;
    if (!opts.to) {
      const { error: markError } = await supabase.rpc("digest_mark_sent", { p_secret: key, p_ids: chunk.map((m) => m.sub.id), p_at: at.toISOString() });
      if (markError) console.error("digest_mark_sent failed:", markError.message);
    }
  }
  console.log("digest run", JSON.stringify({ ...result, preview: undefined }));
  return result;
}

