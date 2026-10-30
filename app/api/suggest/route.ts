import { getCity } from "@/lib/cities";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAPS = /^https:\/\/((www\.)?google\.[a-z.]{2,8}\/maps|maps\.google\.[a-z.]{2,8}|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

// "What are you suggesting?" form: a restaurant or masjid, by Google Maps link or by name and area.
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
  return Response.json({ ok: true });
}
