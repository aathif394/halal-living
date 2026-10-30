"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { SegTabs } from "./slide";

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The changing word in the hero headline ("Halal food / kebabs / biryani …"). */
export function HeroWord({ words }: { words: string[] }) {
  const [state, setState] = useState({ i: 0, prev: -1 });
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden || reduced()) return;
      setState((x) => ({ i: (x.i + 1) % words.length, prev: x.i }));
    }, 2200);
    return () => window.clearInterval(id);
  }, [words.length]);
  return (
    <span className="hl-slot" aria-hidden="true">
      <span className="hl-slot__sizer">{words[state.i]}</span>
      {state.prev >= 0 ? (
        <span key={`o${state.prev}-${state.i}`} className="hl-slot__out">
          {words[state.prev]}
        </span>
      ) : null}
      <span key={`i${state.i}`} className={state.prev >= 0 ? "hl-slot__in" : "hl-slot__now"}>
        {words[state.i]}
      </span>
    </span>
  );
}

/** Mockup success burst: 18 stars fly out from the tick in the city colour, gold and ink. */
function Confetti() {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <span className="hl-burst">
      {Array.from({ length: 18 }, (_, k) => {
        const ang = (k / 18) * Math.PI * 2;
        const d = 90 + (k % 3) * 34;
        return (
          <svg
            key={k}
            className={`hl-burst__p${go ? " is-go" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 40 40"
            aria-hidden="true"
            style={{ "--tx": `${Math.round(Math.cos(ang) * d * 1.6)}px`, "--ty": `${Math.round(Math.sin(ang) * d)}px`, "--r": `${k * 47}deg` } as React.CSSProperties}
          >
            <path d="M20 3 C24 14 26 16 37 20 C26 24 24 26 20 37 C16 26 14 24 3 20 C14 16 16 14 20 3z" fill={["var(--btn)", "#E8B030", "#1C1C1C"][k % 3]} />
          </svg>
        );
      })}
      <span className="hl-burst__tick">
        <Icon name="check" size={38} stroke={2.6} />
      </span>
    </span>
  );
}

type Status = "idle" | "sending" | "sent" | "error";

/** "Know a place we haven't found?" form. Posts to /api/suggest. */
export function SuggestForm({ city, areas }: { city: string; areas: string[] }) {
  const [type, setType] = useState<"rest" | "mas">("rest");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  if (status === "sent") {
    return (
      <div className="hl-sg-done" role="status">
        <Confetti />
        <b>JazakAllah khair!</b>
        <p>Someone from the community will check it before it’s listed.</p>
        <button type="button" className="hl-btn-line" onClick={() => setStatus("idle")}>
          Suggest another place
        </button>
      </div>
    );
  }
  return (
    <form
      className="hl-sg-form"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
        if ((data.name ?? "").trim().length < 2) return setError("Add the name so we can find it.");
        if ((data.contact ?? "").replace(/\D/g, "").length < 10) return setError("Add a 10-digit phone number so we can reach you.");
        setError("");
        setStatus("sending");
        try {
          const response = await fetch("/api/suggest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, type, city }) });
          setStatus(response.ok ? "sent" : "error");
          if (!response.ok) setError("That didn’t send. Check the details and try again.");
        } catch {
          setStatus("error");
          setError("That didn’t send. Check your connection and try again.");
        }
      }}
    >
      <p className="hl-sg-form__h">What are you suggesting?</p>
      <SegTabs
        role="radiogroup"
        label="Type"
        className="hl-seg--form"
        value={type}
        onChange={setType}
        options={[
          { value: "rest", label: "Restaurant" },
          { value: "mas", label: "Masjid" },
        ]}
      />
      <label className="hl-field">
        <span className="hl-label">{type === "rest" ? "Restaurant name" : "Masjid name"}</span>
        <input className="hl-input" name="name" maxLength={200} placeholder={type === "rest" ? "e.g. Kebab corner near the station" : "e.g. Masjid-e-Noor"} />
      </label>
      <div className="hl-field-2">
        <label className="hl-field">
          <span className="hl-label">Area</span>
          <select className="hl-input" name="area" defaultValue="">
            <option value="">Choose an area</option>
            {areas.map((area) => (
              <option key={area}>{area}</option>
            ))}
          </select>
        </label>
        {type === "rest" ? (
          <label className="hl-field">
            <span className="hl-label">Cuisine</span>
            <input className="hl-input" name="cuisine" maxLength={120} placeholder="Biryani, kebabs…" />
          </label>
        ) : null}
      </div>
      <label className="hl-field">
        <span className="hl-label">Why do you rate it?</span>
        <textarea className="hl-input hl-textarea" name="why" maxLength={2000} rows={3} placeholder="What should people order, and how do you know it’s halal?" />
      </label>
      <label className="hl-field">
        <span className="hl-label">Your phone</span>
        <input className="hl-input" name="contact" inputMode="tel" autoComplete="tel" maxLength={40} placeholder="So we can reach you when it’s live" />
      </label>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hl-hp" aria-hidden="true" />
      <p className="hl-fine">Only the Halal Living team sees your phone number. It’s never shown on the site.</p>
      {error ? (
        <p className="hl-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="hl-btn-brand hl-btn-block" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send suggestion"}
        <Icon name="arrowRight" size={16} stroke={2.6} />
      </button>
    </form>
  );
}

/** Mobile opens the suggest form in a bottom sheet; desktop shows it inline. */
export function SuggestSheetButton({ city, areas }: { city: string; areas: string[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
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
      <button type="button" className="hl-sg-open" onClick={() => setOpen(true)}>
        Suggest a place
        <Icon name="arrowRight" size={18} stroke={2.6} />
      </button>
      {open ? (
        <div className="hl-msheet-scrim" onClick={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className="hl-msheet" role="dialog" aria-modal="true" aria-label="Suggest a place">
            <div className="hl-msheet__grab" />
            <button type="button" className="hl-msheet__x" aria-label="Close" onClick={() => setOpen(false)}>
              <Icon name="close" size={18} stroke={2.4} />
            </button>
            <SuggestForm city={city} areas={areas} />
          </div>
        </div>
      ) : null}
    </>
  );
}

/** "Post your ad here" form in a dialog. Posts to /api/advertise. */
export function AdvertiseButton({ city, cityName }: { city: string; cityName: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button type="button" className="hl-ad-go" onClick={() => setOpen(true)}>
        Post your ad here
        <Icon name="arrowRight" size={16} stroke={2.6} />
      </button>
      {open ? (
        <div className="hl-msheet-scrim" onClick={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className="hl-msheet" role="dialog" aria-modal="true" aria-labelledby="ad-h">
            <div className="hl-msheet__grab" />
            <button type="button" className="hl-msheet__x" aria-label="Close" onClick={() => setOpen(false)}>
              <Icon name="close" size={18} stroke={2.4} />
            </button>
            {status === "sent" ? (
              <div className="hl-sg-done" role="status">
                <span className="hl-sg-done__ic">
                  <Icon name="check" size={34} stroke={3} />
                </span>
                <b>Thanks, we’ll be in touch</b>
                <p>Someone from Halal Living will reply within two working days.</p>
              </div>
            ) : (
              <form
                className="hl-sg-form"
                noValidate
                onSubmit={async (event) => {
                  event.preventDefault();
                  const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
                  if ((data.biz ?? "").trim().length < 2) return setError("Add your business name.");
                  const contact = data.contact ?? "";
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.replace(/\D/g, "").length < 8) return setError("Add an email or phone number.");
                  setError("");
                  setStatus("sending");
                  try {
                    const response = await fetch("/api/advertise", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, city }) });
                    setStatus(response.ok ? "sent" : "error");
                    if (!response.ok) setError("That didn’t send. Try again.");
                  } catch {
                    setStatus("error");
                    setError("That didn’t send. Check your connection and try again.");
                  }
                }}
              >
                <p className="hl-sg-form__h" id="ad-h">
                  Advertise in {cityName}
                </p>
                <label className="hl-field">
                  <span className="hl-label">Business name</span>
                  <input className="hl-input" name="biz" maxLength={200} />
                </label>
                <label className="hl-field">
                  <span className="hl-label">Where should it show?</span>
                  <select className="hl-input" name="spot" defaultValue="top">
                    <option value="top">Banner near the top</option>
                    <option value="mid">In the restaurant list</option>
                    <option value="bot">Billboard near the footer</option>
                  </select>
                </label>
                <div className="hl-field-2">
                  <label className="hl-field">
                    <span className="hl-label">Your name</span>
                    <input className="hl-input" name="name" autoComplete="name" maxLength={200} />
                  </label>
                  <label className="hl-field">
                    <span className="hl-label">Email or phone</span>
                    <input className="hl-input" name="contact" maxLength={200} />
                  </label>
                </div>
                <label className="hl-field">
                  <span className="hl-label">What would you like to promote?</span>
                  <textarea className="hl-input hl-textarea" name="msg" rows={3} maxLength={2000} placeholder="Offers, launch dates, budget…" />
                </label>
                <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hl-hp" aria-hidden="true" />
                {error ? (
                  <p className="hl-error" role="alert">
                    {error}
                  </p>
                ) : null}
                <button type="submit" className="hl-btn-brand hl-btn-block" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send enquiry"}
                  <Icon name="arrowRight" size={16} stroke={2.6} />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export type AdSlide = { id: string; href: string; label: string; name: string; pitch: string; cta: string; art: string; bg: string };

/** Mockup .hl-ads: sponsored banners slide every 5 s (paused on hover), with progress dots. */
export function AdCarousel({ ads }: { ads: AdSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (ads.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => !document.hidden && setI((x) => (x + 1) % ads.length), 5000);
    return () => window.clearInterval(id);
  }, [ads.length, paused]);
  return (
    <div className="hl-ads" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="hl-adtrack" style={{ transform: `translateX(-${i * 100}%)` }}>
        {ads.map((ad, k) => (
          <a key={ad.id} className="hl-ad" href={ad.href} style={{ background: ad.bg }} tabIndex={k === i ? 0 : -1} aria-hidden={k !== i}>
            <span className="hl-ad__art" aria-hidden="true">
              <img src={ad.art} alt="" />
            </span>
            <span className="hl-ad__t">
              <span className="hl-ad__k">{ad.label}</span>
              <b>{ad.name}</b>
              <span className="hl-ad__p">{ad.pitch}</span>
            </span>
            <span className="hl-ad__cta">
              {ad.cta}
              <Icon name="arrowRight" size={14} stroke={2.6} />
            </span>
          </a>
        ))}
      </div>
      {ads.length > 1 ? (
        <div className="hl-adots">
          {ads.map((ad, k) => (
            <button key={ad.id} type="button" aria-label={`Show sponsored ${k + 1}`} aria-current={k === i ? "true" : undefined} onClick={() => setI(k)}>
              {k === i ? <i key={`${i}-${paused}`} className={paused ? "" : "is-run"} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
