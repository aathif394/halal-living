import { getCity } from "@/lib/cities";
import { listMasjids } from "@/lib/data";

export const dynamic = "force-dynamic";

// Masjid positions for the locator. Public data; cached at the edge for a few minutes.
export async function GET(request: Request) {
  const city = getCity(new URL(request.url).searchParams.get("city") ?? "");
  if (!city) return Response.json({ masjids: [] }, { status: 404 });
  const rows = await listMasjids(city.slug).catch(() => []);
  const masjids = rows
    .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng) && (row.lat !== 0 || row.lng !== 0))
    .map((row) => ({ slug: row.slug, name: row.name, area: row.neighborhood, lat: row.lat, lng: row.lng }));
  return Response.json({ masjids }, { headers: { "cache-control": "public, max-age=300" } });
}
