import { timingSafeEqual } from "node:crypto";
import { syncGooglePlaces } from "@/lib/google";
import { readEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function sameSecret(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = await readEnv("PLACES_SYNC_SECRET");
  const given = request.headers.get("x-hlc-sync") ?? "";
  if (!expected || !given || !sameSecret(given, expected)) return Response.json({ ok: false }, { status: 401 });

  const url = new URL(request.url);
  const city = (url.searchParams.get("city") ?? "").trim().toLowerCase();
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit") ?? 6) || 6));
  const force = url.searchParams.get("force") === "1";
  try {
    const result = await syncGooglePlaces({ city: city || undefined, limit, force });
    if (!result.ok) return Response.json(result, { status: 503 });
    return Response.json(result);
  } catch {
    return Response.json({ ok: false }, { status: 502 });
  }
}
