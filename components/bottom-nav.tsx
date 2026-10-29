"use client";

import type { CityTheme } from "@/lib/cities";

function locate(citySlug: string) {
  if (!navigator.geolocation) {
    window.location.href = `/${citySlug}/masjids`;
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const url = new URL(`/${citySlug}/masjids`, window.location.origin);
      url.searchParams.set("lat", position.coords.latitude.toFixed(5));
      url.searchParams.set("lng", position.coords.longitude.toFixed(5));
      window.location.href = url.toString();
    },
    () => {
      window.location.href = `/${citySlug}/masjids`;
    },
  );
}

export function BottomNav({ city, current }: { city: CityTheme; current?: "home" | "restaurants" | "masjids" }) {
  return (
    <nav className="hl-bottom-nav" aria-label="Primary">
      <a href={`/${city.slug}`} aria-current={current === "home" ? "page" : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 11l9-8 9 8M5 10v10h14V10" />
        </svg>
        Home
      </a>
      <a href={`/${city.slug}/restaurants`} aria-current={current === "restaurants" ? "page" : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 13h16a8 8 0 0 1-16 0zM3 13h18M9 9c0-1 1-1.5 1-2.5S9 5 9 4M14 9c0-1 1-1.5 1-2.5S14 5 14 4" />
        </svg>
        Food
      </a>
      <a href={`/${city.slug}/masjids`} aria-current={current === "masjids" ? "page" : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 21h16M6 21v-7h12v7M7 14c0-3 2.5-5 5-7 2.5 2 5 4 5 7M12 7V4M3 21V10M21 21V10M10 21v-3a2 2 0 0 1 4 0v3" />
        </svg>
        Masjids
      </a>
      <button type="button" onClick={() => locate(city.slug)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        Nearest
      </button>
    </nav>
  );
}
