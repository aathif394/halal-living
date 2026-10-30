"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CITIES, type CitySlug } from "@/lib/cities";
import { Icon } from "./icons";
import { useRouteState } from "./route";

// Mockup Subscribe: a floating "Stay updated" button (a bell on phones) that appears after the first screen.
// Desktop opens a card above it; phones open a bottom sheet. Monthly digest per city.

const KEY = "hl-sub";

export function Subscribe({ city }: { city: CitySlug }) {
  const { detail } = useRouteState();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [mob, setMob] = useState(false);
  const [subbed, setSubbed] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; cities: CitySlug[]; rest: boolean; mas: boolean }>({ name: "", email: "", cities: [city], rest: true, mas: true });
  const [err, setErr] = useState<{ email?: boolean; kinds?: boolean; cities?: boolean }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const btn = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const email = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      setSubbed(Boolean(localStorage.getItem(KEY)));
    } catch {
      // Private mode.
    }
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.55);
    const onSize = () => setMob(window.innerWidth < 1100);
    onScroll();
    onSize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onSize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onSize);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (card.current && !card.current.contains(event.target as Node) && btn.current && !btn.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", outside);
    const overflow = document.body.style.overflow;
    if (mob) document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => email.current?.focus({ preventScroll: true }), 260);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", outside);
      window.clearTimeout(t);
      document.body.style.overflow = overflow;
    };
  }, [open, mob]);

  if (!mounted || detail) return null;

  const up = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErr({});
    setSaveErr("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const e: typeof err = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = true;
    if (!form.rest && !form.mas) e.kinds = true;
    if (!form.cities.length) e.cities = true;
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const response = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error();
      setDone(true);
      setSubbed(true);
      try {
        localStorage.setItem(KEY, form.cities.join(","));
      } catch {
        // Private mode.
      }
    } catch {
      setSaveErr("Couldn’t save that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const chosenCities = CITIES.filter((c) => form.cities.includes(c.slug));
  const chosen = chosenCities[0] ?? CITIES[0]!;
  const names = chosenCities.map((c) => c.name);
  const cityNames = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
  const chip = (on: boolean, label: string, onClick: () => void) => (
    <button key={label} type="button" className={`sub-chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={onClick}>
      {on ? <Icon name="check" size={13} stroke={3} /> : null}
      {label}
    </button>
  );

  const body = done ? (
    <div className="sub-done">
      <span className="sub-done__ic" style={{ background: chosen.tint, color: chosen.btn }}>
        <Icon name="check" size={26} stroke={2.6} />
      </span>
      <b>You’re on the list for {cityNames}</b>
      <p>
        Once a month we’ll email {form.email.trim()} with new {form.rest && form.mas ? "restaurants and masjids" : form.rest ? "restaurants" : "masjids"}. Every email has an unsubscribe link.
      </p>
      <button type="button" className="hl-btn-line" onClick={() => setOpen(false)}>
        Done
      </button>
    </div>
  ) : (
    <form onSubmit={submit} noValidate>
      <div className="sub-head">
        <span className="sub-head__ic">
          <Icon name="bell" size={18} stroke={2.2} />
        </span>
        <div id="hl-sub-title" className="sub-head__t">
          New places, monthly
        </div>
        <button type="button" className="sub-head__x" aria-label="Close" onClick={() => setOpen(false)}>
          <Icon name="close" size={14} stroke={2.8} />
        </button>
      </div>
      <p className="sub-intro">One email a month with the halal restaurants and masjids we’ve added.</p>
      <label className="sub-lab" htmlFor="hl-sub-name">
        First name (optional)
      </label>
      <input id="hl-sub-name" className="sub-input" value={form.name} autoComplete="given-name" placeholder="Enter your name" onChange={(e) => up({ name: e.target.value })} />
      <label className="sub-lab" htmlFor="hl-sub-email">
        Email
      </label>
      <input
        id="hl-sub-email"
        ref={email}
        className="sub-input"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        aria-invalid={Boolean(err.email)}
        value={form.email}
        onChange={(e) => up({ email: e.target.value })}
      />
      {err.email ? (
        <div className="sub-err" role="alert">
          Enter a valid email address.
        </div>
      ) : null}
      <div className="sub-lab">City</div>
      <div className="sub-chips">
        {CITIES.map((c) =>
          chip(form.cities.includes(c.slug), c.name, () =>
            up({ cities: form.cities.includes(c.slug) ? form.cities.filter((x) => x !== c.slug) : [...form.cities, c.slug] }),
          ),
        )}
      </div>
      {err.cities ? (
        <div className="sub-err" role="alert">
          Pick at least one city.
        </div>
      ) : null}
      <div className="sub-lab">Tell me about</div>
      <div className="sub-chips">
        {chip(form.rest, "Restaurants", () => up({ rest: !form.rest }))}
        {chip(form.mas, "Masjids", () => up({ mas: !form.mas }))}
      </div>
      {err.kinds ? (
        <div className="sub-err" role="alert">
          Pick at least one.
        </div>
      ) : null}
      {saveErr ? (
        <div className="sub-err" role="alert">
          {saveErr}
        </div>
      ) : null}
      <button type="submit" className="sub-go" disabled={busy}>
        {busy ? "Saving…" : "Notify me"}
      </button>
      <div className="sub-fine">Unsubscribe anytime. We never share your email.</div>
    </form>
  );

  const visible = shown;
  const compact = mob || subbed;
  return createPortal(
    <>
      {mob ? (
        open ? (
          <div className="sub-scrim" role="dialog" aria-modal="true" aria-labelledby="hl-sub-title" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div ref={card} className="sub-sheet">
              <div className="hl-msheet__grab" />
              {body}
            </div>
          </div>
        ) : null
      ) : (
        <div ref={card} id="hl-sub-card" className={`sub-card${open ? " is-open" : ""}`} role="dialog" aria-modal="false" aria-labelledby="hl-sub-title" aria-hidden={!open} inert={!open}>
          {body}
        </div>
      )}
      <button
        ref={btn}
        type="button"
        className={`sub-btn${visible ? " is-shown" : ""}${compact ? " is-compact" : ""}${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls="hl-sub-card"
        aria-label={subbed ? "Email updates: subscribed" : "Stay updated by email"}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setDone(false);
        }}
      >
        <Icon name={subbed && !open ? "check" : "bell"} size={18} stroke={subbed && !open ? 2.6 : 2.2} />
        {compact ? null : <span>Stay updated</span>}
      </button>
    </>,
    document.body,
  );
}
