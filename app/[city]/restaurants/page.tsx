import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Directory } from "@/components/directory";
import { CITIES, getCity } from "@/lib/cities";
import { listRestaurants } from "@/lib/data";
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
    title: `Halal restaurants in ${city.name}`,
    description: `Browse halal restaurants in ${city.name}, checked by people who live there.`,
    alternates: { canonical: `${base}/${city.slug}/restaurants` },
  };
}

export default async function RestaurantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const filters = readFilters(await searchParams);
  const [restaurants, allRestaurants] = await Promise.all([
    listRestaurants(city.slug, filters),
    listRestaurants(city.slug),
  ]);
  const base = await siteUrl();
  const areas = [...new Set(allRestaurants.map((place) => place.neighborhood).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const cuisines = [...new Set(allRestaurants.map((place) => place.cuisine).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return (
    <Directory
      city={city}
      kind="restaurants"
      restaurants={restaurants}
      masjids={[]}
      filters={filters}
      areas={areas}
      cuisines={cuisines}
      base={base}
    />
  );
}
