import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { ListPage } from "@/components/list-page";
import { cityOr404, loadCity, one } from "@/lib/load";
import { breadcrumbLd, graphLd, itemListLd, siteUrl } from "@/lib/seo";
import { restaurantCard, toRestaurantView } from "@/lib/view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ city: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const city = cityOr404((await params).city);
  const query = await searchParams;
  const filtered = Boolean(one(query.q) || one(query.near));
  return {
    title: { absolute: `Halal restaurants in ${city.name} · Halal Living` },
    description: `Halal restaurants in ${city.name}, checked by people who live there.`,
    alternates: { canonical: `/${city.slug}/restaurants` },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function RestaurantsPage({ params, searchParams }: Props) {
  const city = cityOr404((await params).city);
  const query = await searchParams;
  const [{ restaurants: rows, areas }, base] = await Promise.all([loadCity(city), siteUrl()]);
  const area = one(query.area);
  return (
    <>
      <ListPage
        city={city}
        kind="restaurants"
        places={rows.map((place) => restaurantCard(toRestaurantView(place)))}
        areas={areas}
        query={one(query.q)}
        area={areas.includes(area) ? area : ""}
        near={one(query.near) === "1"}
      />
      <JsonLd
        data={graphLd([
          breadcrumbLd(base, [
            { name: city.name, path: `/${city.slug}` },
            { name: "Restaurants", path: `/${city.slug}/restaurants` },
          ]),
          itemListLd(base, `Restaurants in ${city.name}`, rows.map((place) => ({ name: place.name, path: `/${city.slug}/restaurants/${place.slug}` }))),
        ])}
      />
    </>
  );
}
