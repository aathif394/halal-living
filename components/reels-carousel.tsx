"use client";

import { useState } from "react";
import type { ShellReel } from "@/lib/shell-data";

export function ReelsCarousel({ reels }: { reels: ShellReel[] }) {
  const [active, setActive] = useState(0);
  const count = reels.length;
  if (!count) return null;

  function ringOffset(index: number): number {
    let delta = index - active;
    const half = count / 2;
    if (delta > half) delta -= count;
    if (delta < -half) delta += count;
    return delta;
  }

  return (
    <div className="hl-reels">
      {count > 1 ? (
        <button
          type="button"
          className="hl-reel-nav prev"
          aria-label="Previous reel"
          onClick={() => setActive((value) => (value - 1 + count) % count)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      ) : null}
      {reels.map((reel, index) => {
        const offset = ringOffset(index);
        const abs = Math.abs(offset);
        const visible = abs <= 2;
        return (
          <div
            key={`${reel.handle}-${index}`}
            className="hl-reel-card"
            role="button"
            tabIndex={0}
            aria-label={`Play reel: ${reel.title}`}
            onClick={() => setActive(index)}
            style={{
              transform: `translateX(${offset * 130}px) scale(${offset === 0 ? 1 : 0.86}) rotate(${offset * 3}deg)`,
              zIndex: 10 - abs,
              opacity: visible ? (offset === 0 ? 1 : 0.7) : 0,
              pointerEvents: visible ? "auto" : "none",
            }}
          >
            {reel.bg ? <div className="hl-reel-bg" style={{ background: reel.bg }} /> : <div className="hl-reel-bg" style={{ background: "#1C1C1C" }} />}
            <div className="hl-reel-shade" />
            <div className="hl-reel-info">
              <div className="hl-reel-handle">{reel.handle}</div>
              <div className="hl-reel-title">{reel.title}</div>
            </div>
          </div>
        );
      })}
      {count > 1 ? (
        <button
          type="button"
          className="hl-reel-nav next"
          aria-label="Next reel"
          onClick={() => setActive((value) => (value + 1) % count)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
