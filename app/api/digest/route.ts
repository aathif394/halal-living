import { runDigest } from "@/lib/digest";
import { readEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Manual digest run, for testing or a re-send. The monthly run itself comes from the Worker cron (worker/index.ts).
// Authorization: Bearer <DIGEST_SECRET>. Body: { "dryRun": true } to preview, { "to": "a@b.c" } to send every
// email to one test address without marking anyone as sent, {} to really send.
export async function POST(request: Request) {
  const secret = await readEnv("DIGEST_SECRET");
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return Response.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean; to?: string };
  try {
    const result = await runDigest({ dryRun: body.dryRun === true, to: typeof body.to === "string" && body.to.includes("@") ? body.to : undefined });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
