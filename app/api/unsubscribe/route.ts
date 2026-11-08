import { unsubscribe } from "@/lib/digest";

export const dynamic = "force-dynamic";

// One-click unsubscribe (RFC 8058: mail apps POST here from the List-Unsubscribe header) and the button on /unsubscribe.
export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("t") ?? "";
  if (!token) {
    const form = await request.formData().catch(() => null);
    token = String(form?.get("t") ?? "");
  }
  const ok = await unsubscribe(token);
  if ((request.headers.get("accept") ?? "").includes("text/html")) {
    return Response.redirect(new URL(`/unsubscribe?done=${ok ? 1 : 0}`, url), 303);
  }
  return Response.json({ ok }, { status: ok ? 200 : 404 });
}
