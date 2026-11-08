import { getCity } from "@/lib/cities";
import { subscribe, unsubscribeHeaders, unsubscribeUrl } from "@/lib/digest";
import { sendEmail, subscribeEmail } from "@/lib/email";
import { siteUrl } from "@/lib/seo";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// "Stay updated": monthly digest sign-up for one or more cities. The subscription lives in digest_subscribers (one row per
// email, see lib/digest.ts); a copy also goes to contact_submissions under topic "subscribe" so it shows with other submissions.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (typeof body.company === "string" && body.company.trim()) return Response.json({ ok: true });
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 120);
  const name = String(body.name ?? "").trim().slice(0, 60);
  const cities = (Array.isArray(body.cities) ? body.cities : [body.city]).map((slug) => getCity(String(slug ?? ""))).filter((c) => c != null);
  const rest = body.rest !== false;
  const mas = body.mas !== false;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !cities.length || (!rest && !mas)) return Response.json({ ok: false }, { status: 400 });
  const topics = [rest && "New restaurants", mas && "New masjids"].filter(Boolean).join(", ");
  const sub = await subscribe({ email, name, cities: cities.map((c) => c.slug), restaurants: rest, masjids: mas });
  if (!sub) return Response.json({ ok: false }, { status: 500 });
  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: "subscribe",
    name: name || "Subscriber",
    email,
    subject: `Monthly digest: ${cities.map((c) => c.name).join(", ")}`,
    body: `Cities: ${cities.map((c) => c.slug).join(", ")}\nTopics: ${topics}`,
  });
  if (error) console.error("subscribe copy to contact_submissions failed:", error.message);
  // Confirmation email. The sign-up is already saved, so a failed send is logged rather than shown to the visitor.
  const mail = subscribeEmail({ name, cities, topics: [rest && "New restaurants", mas && "New masjids"].filter((t): t is string => Boolean(t)), site: await siteUrl(), unsubscribe: unsubscribeUrl(sub.token) });
  const sent = await sendEmail({ to: email, ...mail, headers: unsubscribeHeaders(sub.token) });
  if (!sent.ok) console.error("subscribe email failed:", sent.error);
  return Response.json({ ok: true, emailed: sent.ok });
}
