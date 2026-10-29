import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HalalApp } from "@/components/hl/halal-app";
import { JsonLd } from "@/components/json-ld";
import { type Kind, type SearchRecord, loadAppData } from "@/lib/app-data";
import { CITIES, SITE_DESCRIPTION, getCity, type CitySlug } from "@/lib/cities";
import { getMasjid, getRestaurant } from "@/lib/data";
import { breadcrumbLd, graphLd, itemListLd, masjidLd, restaurantLd, siteUrl } from "@/lib/seo";
import type { PrayerHall, Restaurant } from "@/lib/types";

export type PageKind =
  | { page: "home" }
  | { page: "list"; kind: Kind }
  | { page: "search" }
  | { page: "place"; kind: Kind; slug: string }
  | { page: "suggest" }
  | { page: "advertise" };

function hasCoords(params: SearchRecord) {
  return typeof params.lat === "string" || typeof params.lng === "string";
}

export async function cityMetadata(citySlug: string, kind: PageKind, params: SearchRecord = {}): Promise<Metadata> {
  const city = getCity(citySlug);
  if (!city) return {};
  const base = await siteUrl();
  const robots = hasCoords(params) ? { index: false, follow: true } : undefined;
  if (kind.page === "place") {
    const place = kind.kind === "restaurants" ? await getRestaurant(city.slug, kind.slug) : await getMasjid(city.slug, kind.slug);
    if (!place) return {};
    const path = `/${city.slug}/${kind.kind}/${place.slug}`;
    const photo = place.google_photos[0] ? `${base}/api/photo?name=${encodeURIComponent(place.google_photos[0].name)}` : undefined;
    const description =
      kind.kind === "restaurants"
        ? (place as Restaurant).tagline || (place as Restaurant).description || `${place.name}, halal ${(place as Restaurant).cuisine || "restaurant"} in ${place.neighborhood}, ${city.name}.`
        : place.description || `${place.name}, masjid in ${place.neighborhood}, ${city.name}. Prayer times, Jumu'ah and facilities.`;
    return {
      title: { absolute: `${place.name} · ${city.name} · Halal Living` },
      description,
      alternates: { canonical: `${base}${path}` },
      openGraph: { title: place.name, description, url: `${base}${path}`, images: photo ? [photo] : undefined },
      robots,
    };
  }
  const titles: Record<PageKind["page"], string> = {
    home: `Halal food and masjids in ${city.name} · Halal Living`,
    list: kind.page === "list" && kind.kind === "masjids" ? `Masjids in ${city.name} · Halal Living` : `Halal restaurants in ${city.name} · Halal Living`,
    search: `Search halal places in ${city.name} · Halal Living`,
    suggest: "Suggest a place · Halal Living",
    advertise: "Advertise · Halal Living",
    place: "",
  };
  const path =
    kind.page === "list" ? `/${city.slug}/${kind.kind}` : kind.page === "suggest" ? "/suggest" : kind.page === "advertise" ? "/advertise" : `/${city.slug}`;
  const description =
    kind.page === "suggest"
      ? "Know a halal restaurant or masjid we haven't found? Tell us and someone from the community checks it."
      : kind.page === "advertise"
        ? "Reach people looking for halal places near them in Chennai, Mumbai, Bangalore and Hyderabad."
        : `Halal restaurants and masjids in ${city.name}, checked by people who live there. ${SITE_DESCRIPTION}`;
  return {
    title: { absolute: titles[kind.page] },
    description,
    alternates: { canonical: `${base}${path}` },
    openGraph: { title: titles[kind.page], description, url: `${base}${path}` },
    robots: kind.page === "search" ? { index: false, follow: true } : robots,
  };
}

export async function CityPage({ city: citySlug, kind, searchParams = {} }: { city: string; kind: PageKind; searchParams?: SearchRecord }) {
  const city = getCity(citySlug);
  if (!city) notFound();
  const view = kind.page === "list" ? (kind.kind === "masjids" ? "mas" : "rest") : kind.page === "search" ? "rest" : null;
  const { data, records, place } = await loadAppData({
    city: city.slug,
    view,
    place: kind.page === "place" ? { kind: kind.kind, slug: kind.slug } : undefined,
    scroll: kind.page === "suggest" ? "[data-suggest='1']" : undefined,
    searchParams,
  });
  if (kind.page === "place" && !place) notFound();
  if (kind.page === "advertise") data.boot.open = "ad";

  const base = await siteUrl();
  const rec = records[city.slug];
  const crumbs = [{ name: city.name, path: `/${city.slug}` }];
  const nodes: object[] = [];
  if (kind.page === "place" && place) {
    crumbs.push({ name: kind.kind === "masjids" ? "Masjids" : "Restaurants", path: `/${city.slug}/${kind.kind}` });
    crumbs.push({ name: place.name, path: `/${city.slug}/${kind.kind}/${place.slug}` });
    nodes.push(kind.kind === "masjids" ? masjidLd(base, place as PrayerHall) : restaurantLd(base, place as Restaurant));
  } else if (kind.page === "list") {
    crumbs.push({ name: kind.kind === "masjids" ? "Masjids" : "Restaurants", path: `/${city.slug}/${kind.kind}` });
    const rows = kind.kind === "masjids" ? rec.masjids : rec.restaurants;
    nodes.push(itemListLd(base, `${kind.kind === "masjids" ? "Masjids" : "Halal restaurants"} in ${city.name}`, rows.map((p) => ({ name: p.name, path: `/${city.slug}/${kind.kind}/${p.slug}` }))));
  } else if (kind.page === "home") {
    nodes.push(itemListLd(base, `Halal restaurants in ${city.name}`, rec.restaurants.map((p) => ({ name: p.name, path: `/${city.slug}/restaurants/${p.slug}` }))));
    nodes.push(itemListLd(base, `Masjids in ${city.name}`, rec.masjids.map((p) => ({ name: p.name, path: `/${city.slug}/masjids/${p.slug}` }))));
  }
  nodes.push(breadcrumbLd(base, crumbs));

  return (
    <>
      <HalalApp hlc={data} />
      <JsonLd data={graphLd(nodes)} />
      <noscript>
        <nav aria-label="Directory">
          <h1>Halal restaurants and masjids in {city.name}</h1>
          <h2>Restaurants</h2>
          <ul>
            {rec.restaurants.map((p) => (
              <li key={p.slug}>
                <a href={`/${city.slug}/restaurants/${p.slug}`}>{[p.name, p.neighborhood].filter(Boolean).join(" · ")}</a>
              </li>
            ))}
          </ul>
          <h2>Masjids</h2>
          <ul>
            {rec.masjids.map((p) => (
              <li key={p.slug}>
                <a href={`/${city.slug}/masjids/${p.slug}`}>{[p.name, p.neighborhood].filter(Boolean).join(" · ")}</a>
              </li>
            ))}
          </ul>
          <h2>Cities</h2>
          <ul>
            {CITIES.map((c) => (
              <li key={c.slug}>
                <a href={`/${c.slug}`}>{c.name}</a>
              </li>
            ))}
          </ul>
        </nav>
      </noscript>
    </>
  );
}

export function citySlugs(): { city: CitySlug }[] {
  return CITIES.map((city) => ({ city: city.slug }));
}
