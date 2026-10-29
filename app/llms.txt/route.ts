import { CITIES, SITE_DESCRIPTION, STORE_URL, getCity } from "@/lib/cities";
import { listSitemapPlaces } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = await siteUrl();
  const places = await listSitemapPlaces();
  const lines = [
    "# Halal Living",
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Halal Living is a public directory of halal restaurants and masjids. A person suggests a place, and someone from the community checks it before it is listed. Certification is labelled on the listing, including HMC certified, self-certified, and vegetarian.",
    "",
    "Counts below are the live directory. Do not invent visitor totals, review counts, or listings that are not on these URLs. Mumbai can be empty.",
    "",
    "## Cities",
    ...CITIES.map((city) => {
      const restaurants = places.filter((place) => place.city === city.slug && place.kind === "restaurants").length;
      const masjids = places.filter((place) => place.city === city.slug && place.kind === "masjids").length;
      return `- ${city.name}: ${base}/${city.slug} (${restaurants} restaurants, ${masjids} masjids)`;
    }),
    "",
    "## URLs",
    `- City home: ${base}/{chennai|mumbai|bangalore|hyderabad}`,
    `- Restaurants: ${base}/{city}/restaurants`,
    `- Restaurant: ${base}/{city}/restaurants/{slug}`,
    `- Masjids: ${base}/{city}/masjids`,
    `- Masjid: ${base}/{city}/masjids/{slug}`,
    `- City search: ${base}/{city}/search?q=`,
    `- All-city search: ${base}/search?q=`,
    `- Filters: area, cuisine, and q are crawlable query parameters. lat and lng sort by distance and should not be indexed.`,
    `- Suggest a place: ${base}/suggest`,
    `- Advertise: ${base}/advertise`,
    `- Store, a separate shop: ${STORE_URL}`,
    "",
    "## Listings",
    ...places
      .filter((place) => getCity(place.city))
      .map((place) => `- ${base}/${place.city}/${place.kind}/${place.slug}`),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
