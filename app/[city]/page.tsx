import type { Metadata } from "next";
import { Frame } from "@/components/chrome";
import { CityHome } from "@/components/city-home";
import { JsonLd } from "@/components/json-ld";
import { SITE_DESCRIPTION } from "@/lib/cities";
import { listFeatured } from "@/lib/data";
import { cityOr404, loadCity, loadReels } from "@/lib/load";
import { faqLd, graphLd, itemListLd, siteUrl } from "@/lib/seo";
import { masjidCard, restaurantCard, toMasjidView, toRestaurantView } from "@/lib/view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = cityOr404((await params).city);
  return {
    title: { absolute: `Halal food and masjids in ${city.name} · Halal Living` },
    description: `Halal restaurants and masjids in ${city.name}. ${SITE_DESCRIPTION}`,
    alternates: { canonical: `/${city.slug}` },
  };
}

export default async function CityPage({ params }: Props) {
  const city = cityOr404((await params).city);
  const [{ restaurants, masjids, areas }, reels, featured, base] = await Promise.all([loadCity(city), loadReels(), listFeatured(city.slug).catch(() => []), siteUrl()]);
  const questions = [
    {
      q: `Where can I find halal food in ${city.name}?`,
      a: restaurants.length
        ? `${city.name} currently has ${restaurants.length} halal restaurants on Halal Living, including ${restaurants.slice(0, 3).map((place) => place.name).join(", ")}.`
        : `Halal Living does not have restaurant listings for ${city.name} yet.`,
    },
    {
      q: `Which masjids are listed in ${city.name}?`,
      a: masjids.length
        ? `${masjids.length} masjids and prayer halls are listed, including ${masjids.slice(0, 3).map((place) => place.name).join(", ")}.`
        : `No masjids are listed in ${city.name} yet.`,
    },
    {
      q: "How does a listing get on Halal Living?",
      a: "Someone suggests a restaurant or masjid. A person from the community checks it before it is published.",
    },
  ];
  return (
    <Frame city={city} current="home">
      <CityHome
        city={city}
        restaurants={restaurants.map((place) => restaurantCard(toRestaurantView(place)))}
        masjids={masjids.map((place) => masjidCard(toMasjidView(place)))}
        areas={areas}
        featured={featured}
        reels={reels}
      />
      <JsonLd
        data={graphLd([
          faqLd(questions),
          itemListLd(base, `Halal restaurants in ${city.name}`, restaurants.map((place) => ({ name: place.name, path: `/${city.slug}/restaurants/${place.slug}` }))),
        ])}
      />
    </Frame>
  );
}
