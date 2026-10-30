import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MasjidDetail } from "@/components/detail";
import { JsonLd } from "@/components/json-ld";
import { getMasjid } from "@/lib/data";
import { cityOr404, loadReels } from "@/lib/load";
import { breadcrumbLd, graphLd, masjidLd, siteUrl } from "@/lib/seo";
import { placeReel, toMasjidView } from "@/lib/view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ city: string; slug: string }> };

async function load(params: Props["params"]) {
  const { city: slug, slug: place } = await params;
  const city = cityOr404(slug);
  const row = await getMasjid(city.slug, decodeURIComponent(place)).catch(() => null);
  if (!row) notFound();
  return { city, row };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, row } = await load(params);
  return {
    title: { absolute: `${row.name} · ${city.name} · Halal Living` },
    description: [row.neighborhood, row.address, row.jummah_time && `Jumu’ah ${row.jummah_time}`].filter(Boolean).join(" · "),
    alternates: { canonical: `/${city.slug}/masjids/${row.slug}` },
  };
}

export default async function MasjidPage({ params }: Props) {
  const { city, row } = await load(params);
  const [reels, base] = await Promise.all([loadReels(), siteUrl()]);
  const place = toMasjidView(row);
  const reel = placeReel(place.name, place.area, place.photos, place.art, reels);
  return (
    <>
      <MasjidDetail city={city} place={place} reel={reel} />
      <JsonLd
        data={graphLd([
          breadcrumbLd(base, [
            { name: city.name, path: `/${city.slug}` },
            { name: "Masjids", path: `/${city.slug}/masjids` },
            { name: row.name, path: `/${city.slug}/masjids/${row.slug}` },
          ]),
          masjidLd(base, row),
        ])}
      />
    </>
  );
}
