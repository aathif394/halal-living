import { headers } from "next/headers";
import { CITIES, SITE_DESCRIPTION } from "./cities";
import type { PrayerHall, Restaurant } from "./types";

export async function siteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : (headerList.get("x-forwarded-proto") ?? "https");
  return `${proto}://${host}`;
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function graphLd(nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.map((node) => {
      const copy = { ...(node as Record<string, unknown>) };
      delete copy["@context"];
      return copy;
    }),
  };
}

export function organizationLd(base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Halal Living",
    url: base,
    description: SITE_DESCRIPTION,
    areaServed: CITIES.map((city) => city.name),
  };
}

export function websiteLd(base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Halal Living",
    url: base,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(base: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}

export function restaurantLd(base: string, place: Restaurant) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: place.name,
    url: `${base}/${place.city}/restaurants/${place.slug}`,
    description: place.description ?? place.tagline,
    servesCuisine: place.cuisine,
    priceRange: place.price_range,
    address: place.address,
    telephone: place.google_phone || place.phone || undefined,
    image: place.google_photos[0]
      ? `${base}/api/photo?name=${encodeURIComponent(place.google_photos[0].name)}`
      : place.hero_image ?? undefined,
    openingHours: place.google_hours.length ? place.google_hours : undefined,
    geo:
      place.lat && place.lng
        ? { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng }
        : undefined,
    aggregateRating:
      place.google_place_id && place.google_review_count && place.google_rating
        ? {
            "@type": "AggregateRating",
            ratingValue: place.google_rating,
            reviewCount: place.google_review_count,
          }
        : undefined,
  };
}

export function masjidLd(base: string, place: PrayerHall) {
  return {
    "@context": "https://schema.org",
    "@type": "Mosque",
    name: place.name,
    url: `${base}/${place.city}/masjids/${place.slug}`,
    description: place.description ?? undefined,
    address: place.address,
    telephone: place.google_phone || undefined,
    image: place.google_photos[0] ? `${base}/api/photo?name=${encodeURIComponent(place.google_photos[0].name)}` : undefined,
    maximumAttendeeCapacity: place.capacity || undefined,
    geo:
      place.lat && place.lng
        ? { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng }
        : undefined,
  };
}

export function faqLd(questions: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function itemListLd(base: string, name: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${base}${item.path}`,
    })),
  };
}
