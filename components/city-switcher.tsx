"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CITIES, type CityTheme } from "@/lib/cities";
import { Icon } from "./icons";

/** City name button that opens the full-screen city chooser. */
export function CitySwitcher({ city, variant }: { city: CityTheme; variant: "pill" | "title" }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
      {open
        ? createPortal(
            <div className="hl-chooser" role="dialog" aria-modal="true" aria-labelledby="hl-chooser-h">
              <button ref={closeRef} type="button" className="hl-chooser__x" aria-label="Close" onClick={() => setOpen(false)}>
                <Icon name="close" size={20} stroke={2.4} />
              </button>
              <p className="hl-chooser__k">HALAL LIVING</p>
              <h2 id="hl-chooser-h" className="hl-chooser__h">
                Which city are you in?
              </h2>
              <p className="hl-chooser__s">We'll show you what's close by. Switch from the top bar whenever you like.</p>
              <div className="hl-chooser__grid">
                {CITIES.map((item, index) => (
                  <a
                    key={item.slug}
                    href={`/${item.slug}`}
                    className="hl-chooser__tile"
                    aria-current={item.slug === city.slug ? "true" : undefined}
                    style={{ background: item.btn }}
                  >
                    <span className="hl-stars-bg" style={{ opacity: 0.12 }} aria-hidden="true" />
                    <svg className="hl-chooser__lm" width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth=".6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={item.landmark} />
                    </svg>
                    <span className="hl-chooser__num">0{index + 1}</span>
                    <span className="hl-chooser__name">{item.name}</span>
                    <span className="hl-chooser__go">
                      Show me {item.name}
                      <Icon name="arrowRight" size={16} stroke={2.4} />
                    </span>
                  </a>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
