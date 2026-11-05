"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReelSlide } from "@/lib/view";
import { Icon } from "./icons";
import { useReelPlayback } from "./use-reel-playback";

const CAROUSEL_MS = 3600;
const VIEWER_MS = 7000;

function reduced() {
  return false;
}

function Media({
  reel,
  className,
  playing,
  onEnded,
  onProgress,
  videoRef,
  onPlaybackBlocked,
  muted = false,
  initialTime = 0,
}: {
  reel: ReelSlide;
  className: string;
  playing?: boolean;
  muted?: boolean;
  initialTime?: number;
  onEnded?: () => void;
  onProgress?: (k: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onPlaybackBlocked?: (blocked: boolean) => void;
}) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const video = videoRef || localVideo;
  const [frameReady, setFrameReady] = useState(false);
  const { blocked } = useReelPlayback(video, playing === true, muted, reel.id);

  useEffect(() => {
    setFrameReady(false);
  }, [reel.id]);

  useEffect(() => {
    onPlaybackBlocked?.(blocked);
  }, [blocked, onPlaybackBlocked]);

  useEffect(() => {
    const node = video.current;
    if (!node || initialTime <= 0) return;
    const applyTime = () => {
      if (Math.abs(node.currentTime - initialTime) > 0.5) {
        node.currentTime = initialTime;
      }
    };
    if (node.readyState >= 1) applyTime();
    else node.addEventListener("loadedmetadata", applyTime, { once: true });
  }, [initialTime, video]);

  if (reel.kind === "video" && playing !== undefined) {
    return (
      <>
        <video
          ref={video}
          className={className}
          src={reel.src}
          poster={reel.poster || undefined}
          muted={muted}
          playsInline
          autoPlay={playing}
          preload={playing ? "auto" : "none"}
          onEnded={onEnded}
          onTimeUpdate={(event) => {
            const node = event.currentTarget;
            if (node.currentTime > 0) setFrameReady(true);
            if (node.duration) onProgress?.(node.currentTime / node.duration);
          }}
        />
        {!frameReady && reel.poster ? <img className={`${className} hl-reel-source-poster`} src={reel.poster} alt="" /> : null}
      </>
    );
  }
  return <div className={className} style={{ backgroundImage: `url("${(reel.poster || reel.src).replace(/"/g, "")}")` }} />;
}

/** Full-screen reel viewer (mockup ReelViewer): 7 s per reel, tap left/right thirds to skip, middle to pause. */
export function ReelViewer({
  reels,
  start,
  initialTime = 0,
  initialMuted = false,
  initialPlaying = true,
  onClose,
}: {
  reels: ReelSlide[];
  start: number;
  initialTime?: number;
  initialMuted?: boolean;
  initialPlaying?: boolean;
  onClose: (index: number, currentTime?: number) => void;
}) {
  const n = reels.length;
  const [i, setI] = useState(start);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(initialPlaying);
  const [muted, setMuted] = useState(initialMuted);
  const [blocked, setBlocked] = useState(false);
  const viewerVideo = useRef<HTMLVideoElement>(null);
  const [videoK, setVideoK] = useState(0);
  const at = useRef(i);
  at.current = i;
  const go = useCallback(
    (d: number) => {
      setI((x) => (x + d + n) % n);
      setK((x) => x + 1);
      setVideoK(0);
      setPlaying(true);
    },
    [n],
  );
  const close = useCallback(() => onClose(at.current, viewerVideo.current?.currentTime || 0), [onClose]);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const back = document.activeElement as HTMLElement | null;
    panel.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === " ") {
        event.preventDefault();
        setPlaying((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      back?.focus?.({ preventScroll: true });
    };
  }, [close, go]);

  const r = reels[i]!;
  const run = playing ? "running" : "paused";
  const video = r.kind === "video";

  return createPortal(
    <div className="hl-rv" role="dialog" aria-modal="true" aria-label={`Reel: ${r.title}`} onClick={close}>
      <button type="button" className="hl-rv__circ hl-rv__side" aria-label="Previous reel" onClick={(e) => (e.stopPropagation(), go(-1))}>
        <Icon name="arrowLeft" size={18} stroke={2.6} />
      </button>
      <div ref={panel} tabIndex={-1} className="hl-rv__panel" onClick={(e) => e.stopPropagation()}>
        <div className="hl-rv__bg" style={{ animationPlayState: run }}>
          <Media
            reel={r}
            className="hl-rv__media"
            videoRef={viewerVideo}
            muted={muted}
            playing={playing}
            initialTime={i === start ? initialTime : 0}
            onPlaybackBlocked={setBlocked}
            onEnded={() => go(1)}
            onProgress={(x) => setVideoK(x)}
          />
        </div>
        <div className="hl-rv__shade" />
        <div className="hl-rv__zone hl-rv__zone--l" aria-hidden="true" onClick={() => go(-1)} />
        <div className="hl-rv__zone hl-rv__zone--r" aria-hidden="true" onClick={() => go(1)} />
        <button
          type="button"
          className="hl-rv__zone hl-rv__zone--m"
          aria-label={playing ? "Pause reel" : "Play reel"}
          onClick={(e) => {
            e.stopPropagation();
            if (playing) {
              viewerVideo.current?.pause();
              setPlaying(false);
            } else {
              viewerVideo.current?.play().catch(() => {});
              setPlaying(true);
            }
          }}
        >
          <span className={`hl-rv__play${playing ? "" : " is-on"}`}>
            <Icon name="play" size={30} />
          </span>
        </button>
        <div className="hl-rv__segs">
          {reels.map((reel, j) => (
            <div key={reel.id}>
              {j < i ? (
                <i style={{ width: "100%" }} />
              ) : j === i ? (
                video ? (
                  <i style={{ width: `${videoK * 100}%` }} />
                ) : (
                  <i key={`pg${i}-${k}`} className="hl-rv__prog" style={{ animationDuration: `${VIEWER_MS}ms`, animationPlayState: run }} onAnimationEnd={() => go(1)} />
                )
              ) : null}
            </div>
          ))}
        </div>
        <div className="hl-rv__head">
          <span className="hl-rv__av">
            <img src="/icons/icon-192.png" alt="" />
          </span>
          <span>
            <b>{r.by}</b>
          </span>
        </div>
        <button type="button" className="hl-rv__circ hl-rv__x-m" aria-label="Close reel" onClick={close}>
          <Icon name="close" size={18} stroke={2.6} />
        </button>
        {video ? (
          <button
            type="button"
            className="hl-rv__circ hl-rv__sound"
            aria-label={muted ? "Unmute reel" : "Mute reel"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const next = !muted;
              setMuted(next);
              if (viewerVideo.current) {
                viewerVideo.current.muted = next;
                if (!next && viewerVideo.current.paused) {
                  viewerVideo.current.play().catch(() => {});
                }
              }
            }}
          >
            <Icon name={muted ? "mute" : "volume"} size={18} />
          </button>
        ) : null}
        <div className="hl-rv__cap">
          {r.place !== r.title ? <span className="hl-reel__place"><Icon name="pin" size={12} stroke={2.4} />{r.place}</span> : null}
          <div className="hl-rv__title">{r.title}</div>
          {r.link ? (
            <a className="hl-rv__ig" href={r.link} target="_blank" rel="noopener noreferrer">
              Watch on Instagram
              <Icon name="arrowUpRight" size={12} stroke={2.6} />
            </a>
          ) : null}
        </div>
      </div>
      <button type="button" className="hl-rv__circ hl-rv__side" aria-label="Next reel" onClick={(e) => (e.stopPropagation(), go(1))}>
        <Icon name="arrowRight" size={18} stroke={2.6} />
      </button>
      <button type="button" className="hl-rv__circ hl-rv__x-d" aria-label="Close reel" onClick={close}>
        <Icon name="close" size={18} stroke={2.6} />
      </button>
    </div>,
    document.body,
  );
}

/** "Check out these reels": 3D coverflow that advances every 3.6 s; tap a reel to open the viewer. */
export function ReelsCarousel({ reels }: { reels: ReelSlide[] }) {
  // The ring needs at least 7 cards so there are two either side of the centre (as in the mockup);
  // with fewer reels it repeats them. Dots and the viewer use the real reel index.
  const count = reels.length;
  const slots = Array.from({ length: Math.max(7, count) }, (_, i) => ({ reel: reels[i % count]!, key: `${reels[i % count]!.id}-${i}` }));
  const n = slots.length;
  const [cur, setCur] = useState(0);
  const [open, setOpen] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);
  const root = useRef<HTMLElement>(null);
  const touchX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      setCur(((index % n) + n) % n);
      setTick((x) => x + 1);
    },
    [n],
  );

  useEffect(() => {
    const node = root.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting), { threshold: 0.25 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Advance on a timer while on screen, as the mockup's startReels() does.
  useEffect(() => {
    if (!visible || open >= 0 || reduced()) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setCur((x) => (x + 1) % n);
    }, CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, [visible, open, n, tick]);

  return (
    <section ref={root} className="hl-reels" aria-labelledby="reels-h" data-rv="">
      <div className="hl-wrap hl-reels__head">
        <h2 id="reels-h" className="hl-reels__h">
          Check out these reels
          <svg className="hl-draw" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
            <path d="M5 9 C70 3 160 3 295 7" pathLength={1} strokeWidth="5" />
            <path d="M48 17 C120 13 200 13 252 15" pathLength={1} strokeWidth="2.5" opacity=".5" />
          </svg>
        </h2>
        <div className="hl-reels__arrows">
          <button type="button" aria-label="Previous reel" onClick={() => goTo(cur - 1)}>
            <Icon name="arrowLeft" size={18} stroke={2.4} />
          </button>
          <button type="button" aria-label="Next reel" onClick={() => goTo(cur + 1)}>
            <Icon name="arrowRight" size={18} stroke={2.4} />
          </button>
        </div>
      </div>
      <div
        className="hl-cf"
        onTouchStart={(event) => (touchX.current = event.touches[0]!.clientX)}
        onTouchEnd={(event) => {
          const dx = event.changedTouches[0]!.clientX - touchX.current;
          if (Math.abs(dx) > 40) goTo(cur + (dx < 0 ? 1 : -1));
        }}
      >
        {slots.map(({ reel, key }, i) => {
          let d = (((i - cur) % n) + n) % n;
          if (d > n / 2) d -= n;
          const a = Math.abs(d);
          const scale = a === 0 ? 1 : a === 1 ? 0.84 : 0.7;
          const active = d === 0;
          if (a > 2) return null;
          return (
            <button
              key={key}
              type="button"
              data-reel-id={reel.id}
              className={`hl-cf__card${active ? " is-active" : ""}`}
              style={
                {
                  "--d": d,
                  "--s": scale,
                  opacity: a > 2 ? 0 : a === 2 ? 0.5 : 1,
                  zIndex: 10 - a,
                  pointerEvents: a > 2 ? "none" : undefined,
                } as React.CSSProperties
              }
              tabIndex={a > 1 ? -1 : 0}
              aria-label={`Play reel ${(i % count) + 1}: ${reel.title}`}
              onClick={() => (active ? setOpen(i % count) : goTo(i))}
            >
              <Media reel={reel} className="hl-cf__bg" />
              <span className="hl-cf__shade" />
              <span className="hl-cf__bar">{active ? <i key={`p${cur}-${tick}`} style={{ animationDuration: `${CAROUSEL_MS}ms` }} /> : null}</span>
              <span className="hl-cf__top">
                <span className="hl-cf__av">
                  <img src="/icons/icon-192.png" alt="" />
                </span>
                <b>{reel.by}</b>
                {reel.kind === "video" ? (
                  <span className="hl-cf__dur">
                    <Icon name="play" size={10} />
                  </span>
                ) : null}
              </span>
              <span className="hl-cf__play" aria-hidden="true">
                <Icon name="play" size={24} />
              </span>
              <span className="hl-cf__cap">
                {reel.place !== reel.title ? <span className="hl-reel__place"><Icon name="pin" size={12} stroke={2.4} />{reel.place}</span> : null}
                <span className="hl-cf__title">{reel.title}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="hl-cf__dots">
        {reels.map((reel, i) => Math.abs(i - (cur % count)) <= 4 ? (
          <button key={reel.id} type="button" aria-label={`Show reel ${i + 1}: ${reel.title}`} aria-current={i === cur % count ? "true" : undefined} onClick={() => goTo(cur - (cur % count) + i)} />
        ) : null)}
      </div>
      {open >= 0 ? (
        <ReelViewer
          reels={reels}
          start={open}
          onClose={(index) => {
            setOpen(-1);
            goTo(cur - (cur % count) + index);
          }}
        />
      ) : null}
    </section>
  );
}
