import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Directory } from "@/components/directory";
import { CITIES, getCity } from "@/lib/cities";
import { listMasjids } from "@/lib/data";
import { readFilters } from "@/lib/filters";
import { siteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  const base = await siteUrl();
  return {
    title: `Masjids and prayer halls in ${city.name}`,
    description: `Browse masjids and prayer halls in ${city.name}, with Jumu'ah time, madhab, and facilities.`,
    alternates: { canonical: `${base}/${city.slug}/masjids` },
  };
}

export default async function MasjidsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const filters = readFilters(await searchParams);
  const [masjids, allMasjids] = await Promise.all([
    listMasjids(city.slug, filters),
    listMasjids(city.slug),
  ]);
  const base = await siteUrl();
  const areas = [...new Set(allMasjids.map((place) => place.neighborhood).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return (
    <Directory
      city={city}
      kind="masjids"
      restaurants={[]}
      masjids={masjids}
      filters={filters}
      areas={areas}
      cuisines={[]}
      base={base}
    />
  );
}
