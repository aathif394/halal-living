"use client";

import { useEffect } from "react";
import { Icon } from "./icons";
import { useDeferredNav, useIndicator } from "./slide";

/** Desktop Restaurants / Masjids switch: the white pill slides across, then the page changes. */
export function NavSwitch({ city, current }: { city: string; current?: "home" | "restaurants" | "masjids" }) {
  const items = [
    { key: "restaurants", label: "Restaurants", href: `/${city}/restaurants`, icon: "food" },
    { key: "masjids", label: "Masjids", href: `/${city}/masjids`, icon: "masjidWide" },
  ] as const;
  const { active, go } = useDeferredNav(items.findIndex((item) => item.key === current));
  const { container, box, anim } = useIndicator([active]);
  return (
    <div ref={container as React.RefObject<HTMLDivElement>} className="hl-switch">
      {box && active >= 0 ? (
        <span className={`hl-switch__ind${anim ? " is-anim" : ""}`} aria-hidden="true" style={{ width: box.w, transform: `translateX(${box.x}px)` }} />
      ) : null}
      {items.map((item, i) => (
        <a
          key={item.key}
          className="hl-switch__item"
          href={item.href}
          aria-current={i === active ? "page" : undefined}
          data-on={i === active ? "1" : undefined}
          onClick={go(i, item.href)}
        >
          <Icon name={item.icon} size={18} stroke={2} />
          {item.label}
        </a>
      ))}
    </div>
  );
}

/** Sticky header: transparent at the top of the page, coloured and blurred once the page scrolls. */
export function HeaderScroll() {
  useEffect(() => {
    const head = document.querySelector<HTMLElement>(".hl-topbar");
    if (!head) return;
    const update = () => head.toggleAttribute("data-sc", window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}
