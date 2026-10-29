import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RestaurantDetail } from "@/components/restaurant-detail";
import { getCity } from "@/lib/cities";
import { getRestaurant } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = getCity(citySlug);
  if (!city) return {};
  const place = await getRestaurant(citySlug, slug);
  if (!place) return {};
  const base = await siteUrl();
  return {
    title: `${place.name} — halal ${place.cuisine || "restaurant"} in ${city.name}`,
    description: place.tagline || place.description || `${place.name}, ${place.cuisine} in ${place.neighborhood}, ${city.name}.`,
    alternates: { canonical: `${base}/${city.slug}/restaurants/${place.slug}` },
  };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { city: citySlug, slug } = await params;
  const city = getCity(citySlug);
  if (!city) notFound();
  const place = await getRestaurant(citySlug, slug);
  if (!place) notFound();
  const base = await siteUrl();

  return <RestaurantDetail city={city} place={place} base={base} />;
}
