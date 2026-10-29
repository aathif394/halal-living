import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Directory } from "@/components/directory";
import { getCity } from "@/lib/cities";
import { listMasjids, listRestaurants } from "@/lib/data";
import { readFilters } from "@/lib/filters";
import { siteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  const filters = readFilters(await searchParams);
  return { title: filters.q ? `Search "${filters.q}" in ${city.name}` : `Search ${city.name}` };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const filters = readFilters(await searchParams);
  const [restaurants, masjids] = await Promise.all([
    listRestaurants(city.slug, filters),
    listMasjids(city.slug, filters),
  ]);
  const base = await siteUrl();

  return (
    <Directory
      city={city}
      kind="search"
      restaurants={restaurants}
      masjids={masjids}
      filters={filters}
      areas={[]}
      cuisines={[]}
      base={base}
    />
  );
}
