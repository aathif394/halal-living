import { getCity } from "@/lib/cities";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, msg: "Couldn’t save that. Please try again." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 60);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 120);
  const city = getCity(String(body.city ?? "").trim());
  const rest = body.rest !== false;
  const mas = body.mas !== false;

  if (!emailOk(email) || !city || (!rest && !mas)) {
    return Response.json({ ok: false, msg: "Enter a valid email and pick at least one topic." }, { status: 400 });
  }

  const supabase = await getSupabase();
  const { error } = await supabase.from("subscribers").insert({
    name,
    email,
    city: city.slug,
    rest,
    mas,
  });
  if (error) return Response.json({ ok: false, msg: "Couldn’t save that just now. Please try again." }, { status: 500 });
  return Response.json({ ok: true });
}
