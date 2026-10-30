import { getCity } from "@/lib/cities";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// "Advertise on Halal Living" enquiry: business, contact name, phone, email, message.
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
  const phone = String(body.phone ?? "").trim().slice(0, 40);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
  const msg = String(body.msg ?? "").trim().slice(0, 2000);
  const city = getCity(String(body.city ?? "").trim());
  const digits = (phone.match(/\d/g) ?? []).length;
  if (!biz || digits < 10 || !/^\+?[\d\s-]+$/.test(phone) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const lines = [`City: ${city?.name ?? "Unknown"}`, `Phone: ${phone}`, name ? `Contact name: ${name}` : "", msg ? `\n${msg}` : ""].filter(Boolean);
  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: "advertise",
    name: biz,
    email,
    subject: `Advertise: ${biz}`,
    body: lines.join("\n"),
  });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
