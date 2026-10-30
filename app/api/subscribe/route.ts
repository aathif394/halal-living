import { getCity } from "@/lib/cities";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// "Stay updated": monthly digest sign-up per city. Stored with the other submissions under topic "subscribe".
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
  const city = getCity(String(body.city ?? ""));
  const rest = body.rest !== false;
  const mas = body.mas !== false;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !city || (!rest && !mas)) return Response.json({ ok: false }, { status: 400 });
  const topics = [rest && "New restaurants", mas && "New masjids"].filter(Boolean).join(", ");
  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: "subscribe",
    name: name || "Subscriber",
    email,
    subject: `Monthly digest: ${city.name}`,
    body: `City: ${city.name}\nTopics: ${topics}`,
  });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
