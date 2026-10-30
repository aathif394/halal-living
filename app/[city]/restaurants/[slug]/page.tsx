import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Frame } from "@/components/chrome";
import { RestaurantDetail } from "@/components/detail";
import { JsonLd } from "@/components/json-ld";
import { getRestaurant } from "@/lib/data";
import { cityOr404, loadReels } from "@/lib/load";
import { breadcrumbLd, graphLd, restaurantLd, siteUrl } from "@/lib/seo";
import { placeReel, toRestaurantView } from "@/lib/view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ city: string; slug: string }> };

async function load(params: Props["params"]) {
  const { city: slug, slug: place } = await params;
  const city = cityOr404(slug);
  const row = await getRestaurant(city.slug, decodeURIComponent(place)).catch(() => null);
  if (!row) notFound();
  return { city, row };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, row } = await load(params);
  return {
    title: { absolute: `${row.name} · ${city.name} · Halal Living` },
    description: [row.cuisine, row.neighborhood, row.certification].filter(Boolean).join(" · ") || row.tagline,
    alternates: { canonical: `/${city.slug}/restaurants/${row.slug}` },
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { city, row } = await load(params);
  const [reels, base] = await Promise.all([loadReels(), siteUrl()]);
  const place = toRestaurantView(row);
  const reel = placeReel(place.name, place.area, place.photos, place.art, reels);
  return (
    <Frame city={city} current="restaurants" back detail>
      <RestaurantDetail city={city} place={place} reel={reel} />
      <JsonLd
        data={graphLd([
          breadcrumbLd(base, [
            { name: city.name, path: `/${city.slug}` },
            { name: "Restaurants", path: `/${city.slug}/restaurants` },
            { name: row.name, path: `/${city.slug}/restaurants/${row.slug}` },
          ]),
          restaurantLd(base, row),
        ])}
      />
    </Frame>
  );
}
