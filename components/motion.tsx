"use client";

import { useEffect, useRef, useState } from "react";

function reduced() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Mockup RevealFx: sections marked data-rv rise and fade in as they scroll into view.
 * Content is in the server HTML at full opacity; the hiding class is only added once this runs.
 * Also tells the launch loader the page is ready.
 */
export function Motion() {
  useEffect(() => {
    try {
      (window as Window & { __hlLaunchReady?: () => void }).__hlLaunchReady?.();
    } catch {
      // The loader is optional.
    }
    if (reduced() || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.classList.add("rv-on");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("rv-in");
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    const seen = new WeakSet<Element>();
    const scan = () =>
      document.querySelectorAll("[data-rv]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.getBoundingClientRect().bottom < 0) el.classList.add("rv-in");
        else io.observe(el);
      });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("rv-on");
    };
  }, []);
  return null;
}

/** Mockup CountUp: counts from 0 when first seen (1.6 s, ease-out quart). */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const node = ref.current;
    if (!node || reduced() || !("IntersectionObserver" in window)) return;
    setShown(0);
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry!.isIntersecting) return;
        io.disconnect();
        let start = 0;
        const tick = (now: number) => {
          if (!start) start = now;
          const k = Math.min(1, (now - start) / 1600);
          setShown(Math.round(value * (1 - Math.pow(1 - k, 4))));
          if (k < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return <span ref={ref}>{shown.toLocaleString("en-IN")}</span>;
}

/** Hero wrapper: exposes the pointer position as --px/--py for the floating icons (mockup heroMove). */
export function HeroParallax({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <section
      className={className}
      onMouseMove={(event) => {
        const el = event.currentTarget;
        const box = el.getBoundingClientRect();
        el.style.setProperty("--px", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
        el.style.setProperty("--py", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
      }}
    >
      {children}
    </section>
  );
}

/** Mockup tilt: the photo leans toward the pointer. */
export function tiltHandlers() {
  return {
    onMouseMove: (event: React.MouseEvent<HTMLElement>) => {
      const el = event.currentTarget;
      const box = el.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      el.style.transform = `perspective(700px) rotateX(${-y * 12}deg) rotateY(${x * 14}deg)`;
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      event.currentTarget.style.transform = "";
    },
  };
}
