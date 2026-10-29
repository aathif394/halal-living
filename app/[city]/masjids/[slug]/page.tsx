import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MasjidDetail } from "@/components/masjid-detail";
import { getCity } from "@/lib/cities";
import { getMasjid } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = getCity(citySlug);
  if (!city) return {};
  const place = await getMasjid(citySlug, slug);
  if (!place) return {};
  const base = await siteUrl();
  return {
    title: `${place.name} — masjid in ${city.name}`,
    description: place.description || `${place.name} in ${place.neighborhood}, ${city.name}.`,
    alternates: { canonical: `${base}/${city.slug}/masjids/${place.slug}` },
  };
}

export default async function MasjidPage({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { city: citySlug, slug } = await params;
  const city = getCity(citySlug);
  if (!city) notFound();
  const place = await getMasjid(citySlug, slug);
  if (!place) notFound();
  const base = await siteUrl();

  return <MasjidDetail city={city} place={place} base={base} />;
}
