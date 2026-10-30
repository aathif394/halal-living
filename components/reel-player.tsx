"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReelSlide } from "@/lib/view";
import { Icon } from "./icons";

const IMAGE_MS = 6000;

function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Story-style reel: plays photos (with a slow zoom) and videos one after another,
 * with progress segments, tap to pause, tap the edges to skip, and arrow keys.
 */
export function ReelPlayer({
  slides,
  avatar,
  handle,
  variant,
  backHref,
  label,
  onClose,
  startAt = 0,
}: {
  slides: ReelSlide[];
  avatar: string;
  handle: string;
  variant: "card" | "full" | "viewer";
  backHref?: string;
  label: string;
  onClose?: () => void;
  startAt?: number;
}) {
  const [index, setIndex] = useState(Math.min(startAt, Math.max(0, slides.length - 1)));
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [muted, setMuted] = useState(true);
  const [remaining, setRemaining] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const elapsed = useRef(0);
  const slide = slides[index] ?? slides[0]!;
  const active = playing && visible;

  const go = useCallback(
    (next: number) => {
      const count = slides.length;
      elapsed.current = 0;
      setProgress(0);
      setRemaining(null);
      setIndex(((next % count) + count) % count);
      setPlaying(true);
    },
    [slides.length],
  );

  // The full-screen viewer takes focus so arrow keys and Escape work straight away.
  useEffect(() => {
    if (variant === "viewer") root.current?.focus({ preventScroll: true });
  }, [variant]);

  // Pause while scrolled out of view or while the tab is hidden.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting && !document.hidden)) : null;
    observer?.observe(node);
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Photos advance on a timer; videos report their own progress below.
  useEffect(() => {
    if (slide.kind !== "image" || !active) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const value = Math.min(1, elapsed.current / IMAGE_MS);
      setProgress(value);
      if (value >= 1) {
        go(index + 1);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [slide.kind, active, index, go]);

  useEffect(() => {
    const node = video.current;
    if (!node || slide.kind !== "video") return;
    if (active) node.play().catch(() => setPlaying(false));
    else node.pause();
  }, [active, slide.kind, index]);

  const toggle = () => setPlaying((value) => !value);

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      toggle();
    } else if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
    else if (event.key === "Escape" && onClose) onClose();
  };

  const tap = (event: React.MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    if (slides.length > 1 && x < 0.25) go(index - 1);
    else if (slides.length > 1 && x > 0.75) go(index + 1);
    else toggle();
  };

  const counter = remaining != null ? clock(remaining) : slides.length > 1 ? `${index + 1}/${slides.length}` : slide.kind === "image" ? clock(((1 - progress) * IMAGE_MS) / 1000) : "";

  return (
    <div
      ref={root}
      className={`hl-reel hl-reel--${variant}${active ? " is-playing" : ""}`}
      role="region"
      aria-roledescription="reel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKey}
    >
      <div className="hl-reel__stage" onClick={tap}>
        {slide.kind === "video" ? (
          <video
            key={slide.id}
            ref={video}
            className="hl-reel__media"
            src={slide.src}
            poster={slide.poster || undefined}
            muted={muted}
            playsInline
            autoPlay
            preload="metadata"
            onTimeUpdate={(event) => {
              const node = event.currentTarget;
              if (node.duration) {
                setProgress(node.currentTime / node.duration);
                setRemaining(node.duration - node.currentTime);
              }
            }}
            onEnded={() => go(index + 1)}
            onError={() => go(index + 1)}
          />
        ) : (
          <>
            {slide.art ? <div key={`${slide.id}-bd`} className="hl-reel__backdrop" style={{ backgroundImage: `url("${slide.src.replace(/"/g, "")}")` }} /> : null}
            {slide.art ? (
              <div key={slide.id} className="hl-reel__media hl-reel__img hl-reel__img--art">
                <img src={slide.src} alt="" />
              </div>
            ) : (
              <div key={slide.id} className="hl-reel__media hl-reel__img" style={{ backgroundImage: `url("${slide.src.replace(/"/g, "")}")` }} />
            )}
          </>
        )}
      </div>
      <div className="hl-reel__shade" aria-hidden="true" />
      <div className="hl-reel__segs" aria-hidden="true">
        {slides.map((item, i) => (
          <span key={item.id} className="hl-reel__seg">
            <i style={{ transform: `scaleX(${i < index ? 1 : i === index ? progress : 0})` }} />
          </span>
        ))}
      </div>
      <div className="hl-reel__top">
        {backHref ? (
          <a className="hl-reel__round" href={backHref} aria-label="Back">
            <Icon name="arrowLeft" size={20} stroke={2.4} />
          </a>
        ) : onClose ? (
          <button type="button" className="hl-reel__round" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={20} stroke={2.4} />
          </button>
        ) : (
          <span className="hl-reel__who">
            <span className="hl-reel__avatar" style={{ backgroundImage: `url("${avatar}")` }} />
            <span>
              <b>{handle}</b>
              <small>{slide.place}</small>
            </span>
          </span>
        )}
        <span className="hl-reel__right">
          {slide.kind === "video" ? (
            <button type="button" className="hl-reel__chip" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((value) => !value)}>
              <Icon name={muted ? "mute" : "volume"} size={16} stroke={2.2} />
            </button>
          ) : null}
          {counter ? <span className="hl-reel__chip">{counter}</span> : null}
        </span>
      </div>
      <button type="button" className="hl-reel__play" aria-label={playing ? "Pause reel" : "Play reel"} onClick={toggle}>
        <Icon name={playing ? "pause" : "play"} size={variant === "card" ? 32 : 28} />
      </button>
      {slides.length > 1 ? (
        <>
          <button type="button" className="hl-reel__nav hl-reel__nav--prev" aria-label="Previous" onClick={() => go(index - 1)}>
            <Icon name="chevronLeft" size={20} stroke={2.6} />
          </button>
          <button type="button" className="hl-reel__nav hl-reel__nav--next" aria-label="Next" onClick={() => go(index + 1)}>
            <Icon name="chevronRight" size={20} stroke={2.6} />
          </button>
        </>
      ) : null}
      <div className="hl-reel__cap">
        {slide.place && variant !== "card" ? (
          <span className="hl-reel__place">
            <Icon name="pin" size={12} stroke={2.4} />
            {slide.place}
          </span>
        ) : null}
        <div className="hl-reel__title">{slide.title}</div>
        <div className="hl-reel__by">
          by {slide.by}
          {slide.link ? (
            <a href={slide.link} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
              Watch on Instagram
              <Icon name="arrowUpRight" size={12} stroke={2.6} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
