"use client";

import { useEffect, useRef, useState } from "react";
import type { ReelSlide } from "@/lib/view";
import { Icon } from "./icons";
import { ReelPlayer } from "./reel-player";
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

/** Search pill with a typing placeholder, as in the mockup. Submits to the list page. */
export function TypingSearch({ action, examples, label }: { action: string; examples: string[]; label: string }) {
  const [ph, setPh] = useState("");
  const [value, setValue] = useState("");
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (reduced()) {
      setPh(examples[0] ?? "");
      return;
    }
    let i = 0;
    let n = 0;
    let dir = 1;
    let wait = 4;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const word = examples[i % examples.length] ?? "";
      if (wait > 0) {
        wait--;
        return;
      }
      n += dir;
      if (n >= word.length) {
        n = word.length;
        dir = -1;
        wait = 30;
      } else if (n <= 0) {
        n = 0;
        dir = 1;
        i++;
        wait = 6;
      }
      setPh(word.slice(0, n));
    }, 55);
    return () => window.clearInterval(id);
  }, [examples]);
  return (
    <form className={`hl-search${focus ? " is-focus" : ""}`} action={action} role="search">
      <span className="hl-search__ic">
        <Icon name="search" size={20} stroke={2.4} />
      </span>
      <input
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={`${ph}|`}
        aria-label={label}
        enterKeyHint="search"
        autoComplete="off"
      />
      {value ? (
        <button type="submit" className="hl-search__go" aria-label="Search">
          <Icon name="arrowRight" size={18} stroke={2.6} />
        </button>
      ) : null}
    </form>
  );
}

/** Horizontal reel carousel; tapping a reel opens it full screen in the player. */
export function ReelsStrip({ reels }: { reels: ReelSlide[] }) {
  const [open, setOpen] = useState(-1);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open < 0) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(-1);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const scroll = (dir: number) => {
    const node = track.current;
    if (node) node.scrollBy({ left: dir * Math.min(node.clientWidth * 0.8, 600), behavior: reduced() ? "auto" : "smooth" });
  };
  return (
    <section className="hl-reels" aria-labelledby="reels-h">
      <div className="hl-wrap hl-reels__head">
        <h2 id="reels-h" className="hl-h2 hl-ul hl-ul--light">
          Check out these reels
        </h2>
        <div className="hl-reels__arrows">
          <button type="button" aria-label="Previous reels" onClick={() => scroll(-1)}>
            <Icon name="arrowLeft" size={18} stroke={2.4} />
          </button>
          <button type="button" aria-label="Next reels" onClick={() => scroll(1)}>
            <Icon name="arrowRight" size={18} stroke={2.4} />
          </button>
        </div>
      </div>
      <div className="hl-reels__track" ref={track}>
        {reels.map((reel, i) => (
          <button key={reel.id} type="button" className="hl-reels__card" aria-label={`Play reel: ${reel.title}`} onClick={() => setOpen(i)}>
            {reel.kind === "video" && !reel.poster ? (
              <video src={reel.src} muted playsInline preload="metadata" />
            ) : (
              <img src={reel.poster || reel.src} alt="" loading="lazy" />
            )}
            <span className="hl-reels__shade" />
            <span className="hl-reels__top">
              <span className="hl-reels__av">
                <img src="/icons/icon-192.png" alt="" />
              </span>
              {reel.by}
            </span>
            <span className="hl-reels__play">
              <Icon name="play" size={22} />
            </span>
            <span className="hl-reels__cap">
              <span className="hl-reel__place">
                <Icon name="pin" size={12} stroke={2.4} />
                {reel.place}
              </span>
              <b>{reel.title}</b>
            </span>
          </button>
        ))}
      </div>
      {open >= 0 ? (
        <div className="hl-viewer" role="dialog" aria-modal="true" aria-label="Reels">
          <div className="hl-viewer__box">
            <ReelPlayer slides={reels} startAt={open} avatar="/icons/icon-192.png" handle="@halalliving" variant="viewer" label="Community reels" onClose={() => setOpen(-1)} />
          </div>
        </div>
      ) : null}
    </section>
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
        <span className="hl-sg-done__ic">
          <Icon name="check" size={34} stroke={3} />
        </span>
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
