import { CITIES, getCity } from "@/lib/cities";
import { listSitemapPlaces } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const base = await siteUrl();
  const places = await listSitemapPlaces();
  const paths = [
    ...CITIES.flatMap((city) => [
      `/${city.slug}`,
      `/${city.slug}/restaurants`,
      `/${city.slug}/masjids`,
    ]),
    "/suggest",
    "/advertise",
    ...places
      .filter((place) => getCity(place.city))
      .map((place) => `/${place.city}/${place.kind}/${encodeURIComponent(place.slug)}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${xml(`${base}${path}`)}</loc></url>`).join("\n")}
</urlset>`;
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
