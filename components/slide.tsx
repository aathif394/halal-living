"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

// Sliding indicators copied from the mockup's #hl-switch-js: a pill (or underline) that
// springs to the active item instead of the colour jumping.

type Box = { x: number; y: number; w: number; h: number };

/** Measures the active child of `container` (marked with data-on) and returns where the indicator goes. */
export function useIndicator(deps: unknown[]) {
  const container = useRef<HTMLElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [anim, setAnim] = useState(false);

  const measure = useCallback(() => {
    const active = container.current?.querySelector<HTMLElement>("[data-on='1']");
    if (!active || !active.offsetWidth) return;
    setBox({ x: active.offsetLeft, y: active.offsetTop, w: active.offsetWidth, h: active.offsetHeight });
  }, []);

  useLayoutEffect(() => {
    measure();
    // Only animate after the first placement, so the indicator does not fly in on load.
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { container, box, anim };
}

/** Segmented tabs with a sliding pill (near-you tabs, suggest form type). */
export function SegTabs<T extends string>({
  options,
  value,
  onChange,
  role,
  label,
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  role: "tablist" | "radiogroup";
  label: string;
  className?: string;
}) {
  const { container, box, anim } = useIndicator([value]);
  return (
    <div ref={container as React.RefObject<HTMLDivElement>} className={`hl-seg${className ? ` ${className}` : ""}`} role={role} aria-label={label}>
      {box ? (
        <span
          className={`hl-slide-ind${anim ? " is-anim" : ""}`}
          aria-hidden="true"
          style={{ width: box.w, height: box.h, transform: `translate(${box.x}px, ${box.y}px)` }}
        />
      ) : null}
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role={role === "tablist" ? "tab" : "radio"}
            aria-selected={role === "tablist" ? on : undefined}
            aria-checked={role === "radiogroup" ? on : undefined}
            data-on={on ? "1" : undefined}
            className={on && !box ? "is-solid" : undefined}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Links whose indicator slides to the clicked item before the page changes,
 * like the mockup's deferred switch (340 ms).
 */
export function useDeferredNav(current: number) {
  const [active, setActive] = useState(current);
  const go = (index: number, href: string) => (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 || index === active) return;
    event.preventDefault();
    setActive(index);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => window.location.assign(href), reduce ? 0 : 340);
  };
  return { active, go };
}
