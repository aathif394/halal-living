import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityHome } from "@/components/city-home";
import { JsonLd } from "@/components/json-ld";
import { CITIES, SITE_DESCRIPTION, getCity } from "@/lib/cities";
import { listCommunity, listFeatured, listMasjids, listRestaurants } from "@/lib/data";
import { readNotice } from "@/lib/filters";
import { itemListLd, siteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  const base = await siteUrl();
  return {
    title: `Halal food and masjids in ${city.name}`,
    description: `${city.name} halal restaurants and masjids on Halal Living. ${SITE_DESCRIPTION}`,
    alternates: { canonical: `${base}/${city.slug}` },
  };
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const notice = readNotice(await searchParams);

  const [restaurants, masjids, featured, posts] = await Promise.all([
    listRestaurants(city.slug),
    listMasjids(city.slug),
    listFeatured(city.slug),
    listCommunity(),
  ]);
  const base = await siteUrl();

  return (
    <>
      <CityHome city={city} restaurants={restaurants} masjids={masjids} featured={featured} posts={posts} notice={notice} />
      <JsonLd
        data={itemListLd(
          base,
          `Halal restaurants in ${city.name}`,
          restaurants.map((place) => ({ name: place.name, path: `/${city.slug}/restaurants/${place.slug}` })),
        )}
      />
    </>
  );
}
