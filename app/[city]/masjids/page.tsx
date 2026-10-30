import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { ListPage } from "@/components/list-page";
import { cityOr404, loadCity, one } from "@/lib/load";
import { breadcrumbLd, graphLd, itemListLd, siteUrl } from "@/lib/seo";
import { masjidCard, toMasjidView } from "@/lib/view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ city: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const city = cityOr404((await params).city);
  const query = await searchParams;
  const filtered = Boolean(one(query.q) || one(query.near));
  return {
    title: { absolute: `Masjids and prayer halls in ${city.name} · Halal Living` },
    description: `Masjids and prayer halls in ${city.name}, checked by people who live there.`,
    alternates: { canonical: `/${city.slug}/masjids` },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function MasjidsPage({ params, searchParams }: Props) {
  const city = cityOr404((await params).city);
  const query = await searchParams;
  const [{ masjids: rows, areas }, base] = await Promise.all([loadCity(city), siteUrl()]);
  const area = one(query.area);
  return (
    <>
      <ListPage
        city={city}
        kind="masjids"
        places={rows.map((place) => masjidCard(toMasjidView(place)))}
        areas={areas}
        query={one(query.q)}
        area={areas.includes(area) ? area : ""}
        near={one(query.near) === "1"}
      />
      <JsonLd
        data={graphLd([
          breadcrumbLd(base, [
            { name: city.name, path: `/${city.slug}` },
            { name: "Masjids", path: `/${city.slug}/masjids` },
          ]),
          itemListLd(base, `Masjids in ${city.name}`, rows.map((place) => ({ name: place.name, path: `/${city.slug}/masjids/${place.slug}` }))),
        ])}
      />
    </>
  );
}
