"use client";

import { useEffect, useState } from "react";
import { STORE_URL, type CityTheme } from "@/lib/cities";
import { CitySwitcher } from "./city-switcher";

export function Header({ city, current }: { city: CityTheme; current?: "restaurants" | "masjids" }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="hl-head" data-solid={solid ? "1" : undefined}>
      <div className="hl-head__bar">
        <a className="hl-brand" href={`/${city.slug}`}>
          <span className="hl-mark" aria-hidden="true">
            <img className="hl-brand__img" src={`/icons/cities/${city.slug}.jpg`} alt="" width="46" height="46" />
          </span>
          Halal Living
        </a>
        <CitySwitcher city={city} />
        <div className="hl-nav-tabs">
          <a className="hl-pill" href={`/${city.slug}/restaurants`} aria-current={current === "restaurants" ? "page" : undefined}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 13h16a8 8 0 0 1-16 0zM3 13h18M9 9c0-1 1-1.5 1-2.5S9 5 9 4M14 9c0-1 1-1.5 1-2.5S14 5 14 4" />
            </svg>
            Restaurants
          </a>
          <a className="hl-pill" href={`/${city.slug}/masjids`} aria-current={current === "masjids" ? "page" : undefined}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 21h16M6 21v-7h12v7M7 14c0-3 2.5-5 5-7 2.5 2 5 4 5 7M12 7V4M3 21V10M21 21V10M10 21v-3a2 2 0 0 1 4 0v3" />
            </svg>
            Masjids
          </a>
        </div>
        <button
          type="button"
          className="hl-app-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("hl:install"))}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
          Get the app
        </button>
        <a className="hl-store" href={STORE_URL} target="_blank" rel="noopener noreferrer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0" />
          </svg>
          Store
        </a>
      </div>
    </div>
  );
}
