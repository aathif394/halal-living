"use client";

import { useEffect, useState } from "react";
import { CITIES, type CityTheme } from "@/lib/cities";

export function CitySwitcher({ city }: { city: CityTheme }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className="hl-city-btn" type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        {city.name}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="hl-overlay" role="dialog" aria-modal="true" aria-labelledby="city-chooser-title">
          <div className="hl-overlay-top">
            <button className="hl-city-btn" type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <p className="hl-kicker">HALAL LIVING</p>
          <h2 id="city-chooser-title" style={{ margin: "18px 0 0", fontSize: "clamp(42px, 7vw, 80px)", letterSpacing: "-0.045em", lineHeight: 0.96, maxWidth: 760 }}>
            Which city are you in?
          </h2>
          <p className="hl-dek">We'll show you what's close by. Switch from the top bar whenever you like.</p>
          <div className="hl-city-tiles">
            {CITIES.map((item, index) => (
              <a key={item.slug} className="hl-city-tile" href={`/${item.slug}`} style={{ background: item.btn }}>
                <span>0{index + 1}</span>
                <b>{item.name}</b>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
