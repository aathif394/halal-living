"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

// Mockup LocateNearest: a radar sweeps while we find the visitor, masjids pop onto the radar by bearing,
// and the nearest one is linked with a dashed line. Open it from anywhere with openLocator().

type Masjid = { slug: string; name: string; area: string; lat: number; lng: number };
type Ranked = Masjid & { km: number; ang: number };
type Phase = "locating" | "pick" | "scan" | "done";

const EVENT = "hl:locate";
const SCAN_MS = 2600;

export function openLocator() {
  window.dispatchEvent(new Event(EVENT));
}

function hav(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180;
  const x = Math.sin(((b[0] - a[0]) * r) / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(((b[1] - a[1]) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

function bearing(a: [number, number], b: [number, number]) {
  return Math.atan2((b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180), b[0] - a[0]);
}

const kmText = (k: number) => (k < 1 ? `${Math.round((k * 1000) / 10) * 10} m` : `${k.toFixed(1)} km`);
const howText = (k: number) => (k <= 2 ? `${Math.max(1, Math.round((k / 4.8) * 60))} min walk` : `${Math.max(2, Math.round((k / 18) * 60))} min by car`);

/** Link or button that opens the locator (falls back to the masjid list without script). */
export function LocatorLink({ city, className, children }: { city: string; className: string; children: React.ReactNode }) {
  return (
    <a
      className={className}
      href={`/${city}/masjids?near=1`}
      onClick={(event) => {
        event.preventDefault();
        openLocator();
      }}
    >
      {children}
    </a>
  );
}

export function MasjidLocator({ city, cityName }: { city: string; cityName: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);
  if (!open) return null;
  return createPortal(<LocatorDialog city={city} cityName={cityName} onClose={() => setOpen(false)} />, document.body);
}

function LocatorDialog({ city, cityName, onClose }: { city: string; cityName: string; onClose: () => void }) {
  const [list, setList] = useState<Masjid[] | null>(null);
  const [phase, setPhase] = useState<Phase>("locating");
  const [me, setMe] = useState<[number, number] | null>(null);
  const [sel, setSel] = useState(0);
  const [far, setFar] = useState(false);
  const [mob, setMob] = useState(false);
  const timer = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const begin = useCallback((pos: [number, number]) => {
    setMe(pos);
    setSel(0);
    setPhase("scan");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase("done"), SCAN_MS);
  }, []);

  useEffect(() => {
    setMob(window.innerWidth < 1100);
    closeRef.current?.focus();
    fetch(`/api/masjids?city=${city}`)
      .then((r) => r.json() as Promise<{ masjids: Masjid[] }>)
      .then((data) => setList(data.masjids))
      .catch(() => setList([]));
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      window.clearTimeout(timer.current);
    };
  }, [city, onClose]);

  // Locate once the masjids are in.
  useEffect(() => {
    if (!list) return;
    let done = false;
    const fail = () => {
      if (done) return;
      done = true;
      setPhase("pick");
    };
    const to = window.setTimeout(fail, 4500);
    if (!("geolocation" in navigator)) {
      window.setTimeout(fail, 900);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (g) => {
        if (done) return;
        done = true;
        window.clearTimeout(to);
        const pos: [number, number] = [g.coords.latitude, g.coords.longitude];
        const centre = list[0] ? ([list[0].lat, list[0].lng] as [number, number]) : null;
        setFar(Boolean(centre && hav(pos, centre) > 60));
        begin(pos);
      },
      () => {
        window.clearTimeout(to);
        window.setTimeout(fail, 700);
      },
      { timeout: 4000, maximumAge: 300000 },
    );
    return () => window.clearTimeout(to);
  }, [list, begin]);

  // Area centres for "Pick your area", from the masjids in each area.
  const areas = new Map<string, [number, number, number]>();
  for (const m of list ?? []) {
    const c = areas.get(m.area) ?? [0, 0, 0];
    areas.set(m.area, [c[0] + m.lat, c[1] + m.lng, c[2] + 1]);
  }

  const ranked: Ranked[] = me && list ? list.map((m) => ({ ...m, km: hav(me, [m.lat, m.lng]), ang: bearing(me, [m.lat, m.lng]) })).sort((a, b) => a.km - b.km) : [];
  const best = ranked[sel] ?? ranked[0];
  const R = mob ? 128 : 150;
  const D = R * 2;
  const maxK = ranked.length ? Math.max(0.6, ranked[Math.min(ranked.length - 1, 7)]!.km) : 1;
  const spot = (m: Ranked) => {
    const rr = Math.min(0.92, 0.18 + 0.74 * Math.sqrt(m.km / maxK)) * R;
    return { x: R + Math.sin(m.ang) * rr, y: R - Math.cos(m.ang) * rr };
  };

  let body: React.ReactNode;
  if (phase === "locating") {
    body = (
      <div key="l">
        <div className="ln-title">Finding where you are…</div>
        <div className="ln-sub">Allow location when your browser asks.</div>
      </div>
    );
  } else if (phase === "pick") {
    body = (
      <div key="p">
        <div className="ln-title">Pick your area</div>
        <div className="ln-areas">
          {[...areas.entries()].map(([name, [la, lo, n]]) => (
            <button key={name} type="button" onClick={() => begin([la / n, lo / n])}>
              {name}
            </button>
          ))}
          {!areas.size ? <div className="ln-sub">No masjids with map positions in {cityName} yet.</div> : null}
        </div>
      </div>
    );
  } else if (phase === "scan") {
    body = (
      <div key="s">
        <div className="ln-title">Finding the nearest masjid…</div>
      </div>
    );
  } else if (best) {
    body = (
      <div key={`d${sel}`} className="ln-done">
        <div className="ln-k">NEAREST MASJID</div>
        <div className="ln-title">{best.name}</div>
        <div className="ln-dist">
          {kmText(best.km)} · {howText(best.km)}
        </div>
        {far ? <div className="ln-sub">You’re outside {cityName}.</div> : null}
        <div className="ln-acts">
          <a className="ln-pill ln-pill--solid" href={`https://www.google.com/maps/dir/?api=1&destination=${best.lat},${best.lng}`} target="_blank" rel="noopener noreferrer">
            Directions
            <Icon name="arrowUpRight" size={13} stroke={2.6} />
          </a>
          <a className="ln-pill" href={`/${city}/masjids/${best.slug}`}>
            View masjid
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="ln-scrim" role="dialog" aria-modal="true" aria-label="Locate nearest masjid" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ln-card">
        <button ref={closeRef} type="button" className="ln-x" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={14} stroke={2.6} />
        </button>
        <div className="ln-radar" style={{ width: D, height: D }}>
          {[1, 0.68, 0.36].map((k, i) => (
            <span key={k} className="ln-ring" style={{ left: R - R * k, top: R - R * k, width: D * k, height: D * k, borderColor: `rgba(255,255,255,${i === 0 ? 0.18 : 0.1})` }} />
          ))}
          <span className="ln-axis ln-axis--h" style={{ top: R }} />
          <span className="ln-axis ln-axis--v" style={{ left: R }} />
          {phase === "locating" || phase === "scan" ? <span className="ln-sweep" /> : null}
          {phase === "done" ? <span className="ln-glow" /> : null}
          {phase === "done" && best ? (
            <svg key={`ln${sel}`} className="ln-line" width={D} height={D}>
              <line x1={R} y1={R} x2={spot(best).x} y2={spot(best).y} />
            </svg>
          ) : null}
          {phase === "scan" || phase === "done"
            ? ranked.slice(0, 8).map((m, i) => {
                const { x, y } = spot(m);
                const deg = (((m.ang * 180) / Math.PI) % 360 + 360) % 360;
                const on = phase === "done" && m === best;
                return (
                  <button
                    key={m.slug}
                    type="button"
                    className={`ln-pin${on ? " is-on" : ""}`}
                    disabled={phase !== "done"}
                    title={m.name}
                    aria-label={m.name}
                    style={{ left: x, top: y, animationDelay: `${Math.round((deg / 360) * 1300) + 150}ms` }}
                    onClick={() => setSel(i)}
                  />
                );
              })
            : null}
          <span className="ln-me" style={{ left: R - 9, top: R - 9 }} />
          {phase === "pick" ? (
            <span className="ln-where" style={{ left: R - 44, top: R + 16 }}>
              Where are you?
            </span>
          ) : null}
        </div>
        <div className="ln-body">{body}</div>
      </div>
    </div>
  );
}
