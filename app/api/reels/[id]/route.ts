import catalog from "@/data/reel-directory.json";
import { originalInstagramVideo } from "@/lib/instagram-source";

export const dynamic = "force-dynamic";
const published = new Set(catalog.reels.map(reel => reel.id));

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!published.has(id)) return new Response("Reel not found", { status: 404 });
  try {
    const location = await originalInstagramVideo(id);
    return new Response(null, { status: 302, headers: { location, "cache-control": "public, max-age=300" } });
  } catch (error) {
    console.warn("Instagram source unavailable", id, error instanceof Error ? error.message : "Request failed");
    return new Response("Open the original reel on Instagram to watch.", { status: 502, headers: { "cache-control": "no-store" } });
  }
}
