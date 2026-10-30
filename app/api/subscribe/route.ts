import { getCity } from "@/lib/cities";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// "Stay updated": monthly digest sign-up for one or more cities. Stored with the other submissions under topic "subscribe".
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
  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: "subscribe",
    name: name || "Subscriber",
    email,
    subject: `Monthly digest: ${cities.map((c) => c.name).join(", ")}`,
    body: `Cities: ${cities.map((c) => c.slug).join(", ")}\nTopics: ${topics}`,
  });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
