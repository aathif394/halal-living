import { getCity } from "@/lib/cities";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SPOTS = new Set(["top", "mid", "bot"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (typeof body.company === "string" && body.company.trim()) return Response.json({ ok: true });

  const biz = String(body.biz ?? "").trim().slice(0, 200);
  const name = String(body.name ?? "").trim().slice(0, 200);
  const contact = String(body.contact ?? "").trim().slice(0, 200);
  const spot = String(body.spot ?? "").trim();
  const month = String(body.month ?? "").trim().slice(0, 40);
  const msg = String(body.msg ?? "").trim().slice(0, 2000);
  const city = getCity(String(body.city ?? "").trim());
  const digits = contact.replace(/\D/g, "");
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  if (biz.length < 2 || !SPOTS.has(spot) || (!email && digits.length < 8)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const lines = [
    `City: ${city?.name ?? "Unknown"}`,
    `Spot: ${spot}`,
    month ? `Month: ${month}` : "",
    name ? `Contact name: ${name}` : "",
    `Reach: ${contact}`,
    msg ? `\n${msg}` : "",
  ].filter(Boolean);

  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: "advertise",
    name: biz,
    email: contact,
    subject: `Advertise: ${biz}`,
    body: lines.join("\n"),
  });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
