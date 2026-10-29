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

  const business = text(body.business, 200);
  const name = text(body.name, 120);
  const phone = text(body.phone, 40);
  const email = text(body.email, 120);
  const message = text(body.message, 2000);
  if (!business || phone.replace(/\D/g, "").length < 10 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const supabase = await getSupabase();
  const { error } = await supabase.from("contact_submissions").insert({
    topic: "ads",
    name: name || business,
    email,
    subject: `Advertise: ${business}`,
    body: [`Business: ${business}`, `Phone: ${phone}`, message && `\n${message}`].filter(Boolean).join("\n"),
  });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
