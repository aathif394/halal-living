"use client";

import { useEffect } from "react";
import { Icon } from "./icons";
import { useRouteState } from "./route";
import { useIndicator, useNavTo } from "./slide";

/** Desktop Restaurants / Masjids switch: the white pill slides across, then the page changes. */
export function NavSwitch({ city }: { city: string }) {
  const { section } = useRouteState();
  const items = [
    { key: "restaurants", label: "Restaurants", href: `/${city}/restaurants`, icon: "food" },
    { key: "masjids", label: "Masjids", href: `/${city}/masjids`, icon: "masjidWide" },
  ] as const;
  const { active, go } = useNavTo(items.findIndex((item) => item.key === section));
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

/** Frame root: on phones, place pages hide the top bar, footer and bottom bar (reel + drawer instead). */
export function FrameRoot({ className, style, city, children }: { className: string; style: React.CSSProperties; city: string; children: React.ReactNode }) {
  const { detail } = useRouteState();
  return (
    <div id="top" className={`${className}${detail ? " hl-frame--detail" : ""}`} data-city={city} style={style}>
      {children}
    </div>
  );
}

/** Desktop: "← City" on place pages, the city chooser elsewhere. */
export function CityOrBack({ city, name, chooser }: { city: string; name: string; chooser: React.ReactNode }) {
  const { detail, section } = useRouteState();
  if (!detail) return <>{chooser}</>;
  return (
    <a className="hl-city hl-back" href={`/${city}/${section}`} aria-label={`Back to ${name}`}>
      <Icon name="arrowLeft" size={16} stroke={2.6} />
      {name}
    </a>
  );
}
