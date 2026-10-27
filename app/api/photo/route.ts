import { PHOTO_NAME } from "@/lib/google";
import { readEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name") ?? "";
  if (!PHOTO_NAME.test(name)) return new Response(null, { status: 400 });
  const key = await readEnv("GOOGLE_PLACES_API_KEY");
  if (!key) return new Response(null, { status: 404 });

  const media = new URL(`https://places.googleapis.com/v1/${name}/media`);
  media.searchParams.set("maxWidthPx", "1200");
  media.searchParams.set("skipHttpRedirect", "true");
  const lookup = await fetch(media, { headers: { "X-Goog-Api-Key": key } });
  if (!lookup.ok) return new Response(null, { status: 502 });
  const payload = (await lookup.json()) as { photoUri?: string };
  if (!payload.photoUri || !payload.photoUri.startsWith("https://")) return new Response(null, { status: 502 });

  const image = await fetch(payload.photoUri);
  if (!image.ok || !image.body) return new Response(null, { status: 502 });
  const type = image.headers.get("content-type") ?? "image/jpeg";
  if (!type.startsWith("image/")) return new Response(null, { status: 502 });
  return new Response(image.body, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=86400",
    },
  });
}
