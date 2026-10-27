import { getCity } from "@/lib/cities";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (typeof body.company === "string" && body.company.trim()) return Response.json({ ok: true });

  const name = String(body.name ?? "").trim().slice(0, 200);
  const contact = String(body.contact ?? "").trim().slice(0, 40);
  const digits = contact.replace(/\D/g, "");
  const area = String(body.area ?? "").trim().slice(0, 120);
  const cuisine = String(body.cuisine ?? "").trim().slice(0, 120);
  const why = String(body.why ?? "").trim().slice(0, 2000);
  const city = getCity(String(body.city ?? "").trim());
  const topic = body.type === "mas" ? "masjid" : "restaurant";
  if (name.length < 2 || digits.length < 10) return Response.json({ ok: false }, { status: 400 });

  const lines = [`City: ${city?.name ?? "Unknown"}`, `Phone: ${contact}`];
  if (area) lines.push(`Area: ${area}`);
  if (cuisine) lines.push(`Cuisine: ${cuisine}`);
  if (why) lines.push("", why);

  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic,
    name,
    email: contact,
    subject: `Suggestion: ${name}`,
    body: lines.join("\n"),
  });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
