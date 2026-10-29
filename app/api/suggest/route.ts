import { getCity } from "@/lib/cities";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (text(body.company, 200)) return Response.json({ ok: true });

  const type = body.type === "mas" ? "masjid" : "restaurant";
  const place = text(body.place, 80);
  const mapsUrl = text(body.mapsUrl, 500);
  const area = text(body.area, 120);
  const name = text(body.name, 60);
  const email = text(body.email, 120);
  const city = getCity(text(body.city, 40));
  if (place.length < 2 || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ ok: false, msg: "Add the place, your name and a valid email." }, { status: 400 });
  }

  const fac = body.facilities && typeof body.facilities === "object" ? (body.facilities as Record<string, unknown>) : {};
  const facilities = [fac.women && "Women's area", fac.park && "Parking", fac.jumuah && "Jumu'ah"].filter(Boolean).join(", ");
  const lines = [
    `Kind: ${type}`,
    `City: ${city?.name ?? "Unknown"}`,
    area && `Area: ${area}`,
    mapsUrl && `Map: ${mapsUrl}`,
    facilities && `Facilities: ${facilities}`,
  ].filter(Boolean);

  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: type,
    name,
    email,
    subject: `Suggestion: ${place}`,
    body: lines.join("\n"),
  });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
