"use client";

import type { CityTheme } from "@/lib/cities";
import { Icon } from "./icons";
import { useDeferredNav, useIndicator } from "./slide";

/** Mobile bottom bar: Home · Food · Masjids · Masjid locator (pill in the theme colour). */
export function BottomNav({ city, current }: { city: CityTheme; current: "home" | "restaurants" | "masjids" }) {
  const items = [
    { key: "home", label: "Home", href: `/${city.slug}`, icon: "home" },
    { key: "restaurants", label: "Food", href: `/${city.slug}/restaurants`, icon: "food" },
    { key: "masjids", label: "Masjids", href: `/${city.slug}/masjids`, icon: "masjid" },
  ] as const;
  const { active, go } = useDeferredNav(items.findIndex((item) => item.key === current));
  const { container, box, anim } = useIndicator([active]);
  return (
    <nav ref={container as React.RefObject<HTMLElement>} className="hl-bnav" aria-label="Main">
      {items.map((item, i) => {
        const on = i === active;
        return (
          <a key={item.key} className="bn-it" href={item.href} aria-current={on ? "page" : undefined} data-on={on ? "1" : undefined} onClick={go(i, item.href)}>
            <Icon name={item.icon} size={22} stroke={on ? 2.1 : 1.8} />
            {item.label}
          </a>
        );
      })}
      <span className="bn-loc">
        <a className="bn-fab" href={`/${city.slug}/masjids?near=1`}>
          <Icon name="pin" size={18} />
          Masjid locator
        </a>
      </span>
      {box ? <span className={`hl-bn-ind${anim ? " is-anim" : ""}`} aria-hidden="true" style={{ transform: `translateX(${box.x + box.w / 2 - 8}px)` }} /> : null}
    </nav>
  );
}
