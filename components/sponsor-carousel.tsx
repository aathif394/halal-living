"use client";

import { useEffect, useState } from "react";
import type { Featured } from "@/lib/types";

export function SponsorCarousel({ city, featured }: { city: string; featured: Featured[] }) {
  const [active, setActive] = useState(0);
  const count = featured.length;

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % count), 4500);
    return () => window.clearInterval(timer);
  }, [count]);

  if (!count) return null;

  return (
    <div className="hl-ads" aria-label="Sponsored">
      <div className="hl-adtrack" style={{ transform: `translateX(-${active * 100}%)` }}>
        {featured.map((item) => (
          <a
            key={item.id}
            className="hl-ad-slide"
            href={item.restaurant_slug ? `/${item.restaurant_city ?? city}/restaurants/${item.restaurant_slug}` : `/${city}/restaurants`}
          >
            <div className="hl-kicker">{item.sponsor_label || "SPONSORED"}</div>
            <strong>
              {item.name}: {item.pitch}
            </strong>
          </a>
        ))}
      </div>
      {count > 1 ? (
        <div className="hl-ad-dots">
          {featured.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="hl-adot"
              aria-label={`Show sponsor ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
