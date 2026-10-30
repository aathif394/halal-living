"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CITIES, type CityTheme } from "@/lib/cities";
import { Icon } from "./icons";

// Mockup city chooser: dark full-screen panel, tiles rise in one after another; on desktop the hovered
// tile widens and its landmark tilts. Picking a city sweeps a circle of the new colour over the page
// (landmark and name in the middle), then the new city's page fades in from under it.

const WIPE_KEY = "hl-wipe";
const CENTRES: Record<string, [number, number]> = {
  chennai: [13.0827, 80.2707],
  mumbai: [19.076, 72.8777],
  bangalore: [12.9716, 77.5946],
  hyderabad: [17.385, 78.4867],
};

function reduced() {
  return false;
}

function Wipe({ city, phase }: { city: CityTheme; phase: "in" | "full" | "out" }) {
  return (
    <div className={`hl-wipe is-${phase}`} style={{ background: city.btn }} aria-hidden="true">
      <div className="hl-wipe__in">
        <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d={city.landmark} />
        </svg>
        <div className="hl-wipe__name">{city.name}</div>
      </div>
    </div>
  );
}

/** On the page we arrive at after picking a city, the wipe fades away. */
export function CityWipeIn() {
  const [city, setCity] = useState<CityTheme | null>(null);
  const [phase, setPhase] = useState<"full" | "out">("full");
  useEffect(() => {
    let slug: string | null = null;
    try {
      slug = sessionStorage.getItem(WIPE_KEY);
      sessionStorage.removeItem(WIPE_KEY);
    } catch {
      return;
    }
    const target = CITIES.find((c) => c.slug === slug);
    if (!target) return;
    setCity(target);
    const t1 = window.setTimeout(() => setPhase("out"), 120);
    const t2 = window.setTimeout(() => setCity(null), 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  return city ? createPortal(<Wipe city={city} phase={phase} />, document.body) : null;
}

/** City name button that opens the full-screen city chooser. */
export function CitySwitcher({ city, variant }: { city: CityTheme; variant: "pill" | "title" }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [hover, setHover] = useState(-1);
  const [wipe, setWipe] = useState<{ city: CityTheme; phase: "in" | "full" } | null>(null);
  const [locating, setLocating] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setShown(false);
    setHover(-1);
    window.setTimeout(() => setOpen(false), reduced() ? 0 : 400);
  };

  const pick = (target: CityTheme) => {
    close();
    if (target.slug === city.slug) return;
    try {
      sessionStorage.setItem(WIPE_KEY, target.slug);
    } catch {
      // Without storage the new page simply appears.
    }
    if (reduced()) {
      window.location.assign(`/${target.slug}`);
      return;
    }
    setWipe({ city: target, phase: "in" });
    requestAnimationFrame(() => requestAnimationFrame(() => setWipe({ city: target, phase: "full" })));
    window.setTimeout(() => window.location.assign(`/${target.slug}`), 800);
  };

  const useLocation = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const dist = (c: [number, number]) => (c[0] - here[0]) ** 2 + (c[1] - here[1]) ** 2;
        const nearest = [...CITIES].sort((a, b) => dist(CENTRES[a.slug]!) - dist(CENTRES[b.slug]!))[0]!;
        pick(nearest);
      },
      () => setLocating(false),
      { timeout: 20000, maximumAge: 600000 },
    );
  };

  return (
    <>
      <button
        type="button"
        className={variant === "pill" ? "hl-city" : "hl-city-title"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`City: ${city.name}. Change city`}
        onClick={() => setOpen(true)}
      >
        {city.name}
        <Icon name="chevronDown" size={variant === "pill" ? 14 : 13} stroke={3} />
      </button>
      {mounted && open
        ? createPortal(
            <div className={`hl-chooser${shown ? " is-shown" : ""}`} role="dialog" aria-modal="true" aria-labelledby="hl-chooser-h">
              <div className="hl-chooser__bar">
                <button type="button" className="hl-chooser__loc" onClick={useLocation} disabled={locating}>
                  <Icon name="locate" size={18} stroke={2.2} />
                  {locating ? "Finding you…" : "Use my location"}
                </button>
                <button ref={closeRef} type="button" className="hl-chooser__x" aria-label="Close" onClick={close}>
                  <Icon name="close" size={18} stroke={2.4} />
                </button>
              </div>
              <div className="hl-chooser__intro">
                <h2 id="hl-chooser-h" className="hl-chooser__h">
                  Which city are you in?
                </h2>
                <p className="hl-chooser__s">We'll show you what's close by. Switch from the top bar whenever you like.</p>
              </div>
              <div className="hl-chooser__grid" onMouseLeave={() => setHover(-1)}>
                {CITIES.map((item, i) => (
                  <a
                    key={item.slug}
                    href={`/${item.slug}`}
                    className={`hl-chooser__tile${hover === i ? " is-hover" : ""}${hover >= 0 && hover !== i ? " is-other" : ""}`}
                    aria-current={item.slug === city.slug ? "true" : undefined}
                    style={{ background: item.btn, transitionDelay: shown ? `0ms, ${i * 90 + 150}ms, ${i * 90 + 150}ms` : "0ms" }}
                    onMouseEnter={() => setHover(i)}
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey) return;
                      event.preventDefault();
                      pick(item);
                    }}
                  >
                    <span className="hl-stars-bg" style={{ opacity: 0.12 }} aria-hidden="true" />
                    <svg className="hl-chooser__lm" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth=".6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={item.landmark} />
                    </svg>
                    <span className="hl-chooser__num">0{i + 1}</span>
                    <span className="hl-chooser__name">{item.name}</span>
                  </a>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
      {mounted && wipe ? createPortal(<Wipe city={wipe.city} phase={wipe.phase} />, document.body) : null}
    </>
  );
}
