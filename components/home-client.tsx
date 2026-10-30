"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";
import { SegTabs } from "./slide";

function reduced() {
  return false;
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

/** Mockup parseMaps: accepts Google Maps links and pulls the place name out of /maps/place/<name>. */
function parseMaps(raw: string): { url: string; name: string } | null {
  try {
    const str = raw.trim();
    if (!str || str.length > 2000) return null;
    const url = new URL(str);
    if (url.protocol !== "https:") return null;
    const h = url.hostname.toLowerCase();
    const ok =
      (/^(www\.)?google\.[a-z.]{2,8}$/.test(h) && url.pathname.startsWith("/maps")) ||
      /^maps\.google\.[a-z.]{2,8}$/.test(h) ||
      h === "maps.app.goo.gl" ||
      (h === "goo.gl" && url.pathname.startsWith("/maps"));
    if (!ok) return null;
    const m = url.pathname.match(/\/maps\/place\/([^/]+)/);
    let name = "";
    if (m) {
      try {
        name = decodeURIComponent(m[1]!.replace(/\+/g, " "));
      } catch {
        name = m[1]!.replace(/\+/g, " ");
      }
    }
    return { url: url.toString(), name };
  } catch {
    return null;
  }
}

const FACILITIES = [
  ["women", "Women’s area"],
  ["park", "Parking"],
  ["jumuah", "Jumu’ah held"],
] as const;

/** "What are you suggesting?" form, field for field as in the mockup. Posts to /api/suggest. */
export function SuggestForm({ city, cityName, areas }: { city: string; cityName: string; areas: string[] }) {
  const [type, setType] = useState<"rest" | "mas">("rest");
  const [noMaps, setNoMaps] = useState(false);
  const [maps, setMaps] = useState("");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [fac, setFac] = useState<Record<string, boolean>>({});
  const [you, setYou] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<{ maps?: boolean; name?: boolean; you?: boolean; email?: boolean }>({});
  const [saveErr, setSaveErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; area: string } | null>(null);
  const rest = type === "rest";
  const parsed = noMaps ? null : parseMaps(maps);
  const showName = noMaps || (!rest && Boolean(parsed) && !parsed!.name);
  const showArea = noMaps;

  if (done) {
    return (
      <div className="hl-sg-done" role="status">
        <Confetti />
        <b>JazakAllah khair!</b>
        <p>
          We’ll check {done.name} in {done.area} and list it once someone has visited.
        </p>
        <button type="button" className="hl-btn-line" onClick={() => setDone(null)}>
          Suggest another place
        </button>
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const e = {
      maps: !noMaps && !parsed,
      name: noMaps && !name.trim(),
      you: !you.trim(),
      email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()),
    };
    setErr(e);
    setSaveErr("");
    if (e.maps || e.name || e.you || e.email) return;
    if (noMaps && !area) {
      setSaveErr("Pick the area it’s in.");
      return;
    }
    const placeName = (noMaps ? name.trim() : parsed?.name || name.trim()).slice(0, 80);
    setBusy(true);
    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          city,
          maps: parsed?.url ?? "",
          name: placeName,
          area: area && area !== "Other" ? area : "",
          facilities: rest ? [] : FACILITIES.filter(([k]) => fac[k]).map(([, l]) => l),
          you: you.trim().slice(0, 60),
          email: email.trim().slice(0, 120),
        }),
      });
      if (!response.ok) throw new Error();
      setDone({ name: placeName || (rest ? "this restaurant" : "this masjid"), area: area && area !== "Other" ? area : cityName });
      setNoMaps(false);
      setMaps("");
      setName("");
      setArea("");
      setFac({});
    } catch {
      setSaveErr("That didn’t send. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="hl-sg-form" noValidate onSubmit={submit}>
      <p className="hl-sg-form__h">What are you suggesting?</p>
      <SegTabs
        role="radiogroup"
        label="Type"
        className="hl-seg--form"
        value={type}
        onChange={(value) => {
          setType(value);
          setErr({});
          setSaveErr("");
        }}
        options={[
          { value: "rest", label: "Restaurant" },
          { value: "mas", label: "Masjid" },
        ]}
      />
      {noMaps ? null : (
        <label className="hl-field hl-field--first">
          <span className="hl-label">Google Maps link</span>
          <input
            className="hl-input"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={maps}
            aria-invalid={Boolean(err.maps)}
            placeholder={rest ? "Paste the restaurant’s Google Maps link" : "Paste the masjid’s Google Maps link"}
            onChange={(e) => {
              setMaps(e.target.value);
              setErr((x) => ({ ...x, maps: false }));
            }}
          />
          {err.maps ? <div className="hl-error">Paste a Google Maps link, like maps.app.goo.gl/… or google.com/maps/…</div> : null}
        </label>
      )}
      <div>
        <button
          type="button"
          className="hl-sg-toggle"
          onClick={() => {
            setNoMaps((v) => !v);
            setErr({});
            setSaveErr("");
          }}
        >
          {noMaps ? "Have a Google Maps link? Paste it instead" : "Not on Google Maps? Enter the name and area"}
        </button>
      </div>
      {showName ? (
        <label className="hl-field hl-field--first">
          <span className="hl-label">{rest ? "Restaurant name" : "Masjid or prayer hall name"}</span>
          <input
            className="hl-input"
            value={name}
            aria-invalid={Boolean(err.name)}
            placeholder={rest ? "e.g. Bismillah Biryani Centre" : "e.g. Masjid-e-Noor"}
            onChange={(e) => {
              setName(e.target.value);
              setErr((x) => ({ ...x, name: false }));
            }}
          />
          {err.name ? <div className="hl-error">Add the name so we can find it.</div> : null}
        </label>
      ) : null}
      {showArea ? (
        <label className="hl-field">
          <span className="hl-label">Area</span>
          <select className="hl-input hl-select" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Pick an area</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
            <option value="Other">Somewhere else</option>
          </select>
        </label>
      ) : null}
      {rest ? null : (
        <div className="hl-field">
          <span className="hl-label">What’s there?</span>
          <div className="hl-fac">
            {FACILITIES.map(([k, label]) => {
              const on = Boolean(fac[k]);
              return (
                <button key={k} type="button" className={`hl-fac__chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => setFac((f) => ({ ...f, [k]: !f[k] }))}>
                  <span className="hl-fac__box">
                    <Icon name="check" size={12} stroke={4} />
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <label className="hl-field">
        <span className="hl-label">Your name</span>
        <input
          className="hl-input"
          autoComplete="name"
          value={you}
          aria-invalid={Boolean(err.you)}
          placeholder="So we know who suggested it"
          onChange={(e) => {
            setYou(e.target.value);
            setErr((x) => ({ ...x, you: false }));
          }}
        />
        {err.you ? <div className="hl-error">Add your name.</div> : null}
      </label>
      <label className="hl-field">
        <span className="hl-label">Email</span>
        <input
          className="hl-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          aria-invalid={Boolean(err.email)}
          placeholder={rest ? "So we can reach you when it’s live" : "In case we need to check anything"}
          onChange={(e) => {
            setEmail(e.target.value);
            setErr((x) => ({ ...x, email: false }));
          }}
        />
        {err.email ? <div className="hl-error">Enter a valid email address.</div> : null}
      </label>
      <p className="hl-fine">Only the Halal Living team sees your name and email. They’re never shown on the site.</p>
      <button type="submit" className="hl-sg-submit" disabled={busy}>
        {busy ? "Sending…" : "Send suggestion"}
        {busy ? null : <Icon name="arrowRight" size={17} stroke={2.6} />}
      </button>
      {saveErr ? (
        <div role="alert" className="hl-sg-saveerr">
          {saveErr}
        </div>
      ) : null}
    </form>
  );
}

/** Mobile opens the suggest form in a bottom sheet; desktop shows it inline. */
export function SuggestSheetButton({ city, cityName, areas }: { city: string; cityName: string; areas: string[] }) {
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
            <SuggestForm city={city} cityName={cityName} areas={areas} />
          </div>
        </div>
      ) : null}
    </>
  );
}

/** "Post your ad here": the mockup's AdEnquiry dialog (centred on desktop, bottom sheet on phones). */
export function AdvertiseButton({ city, cityName, reach }: { city: string; cityName: string; reach: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="hl-ad-go" onClick={() => setOpen(true)}>
        Post your ad here
        <Icon name="arrowRight" size={16} stroke={2.6} />
      </button>
      {open ? createPortal(<AdEnquiry city={city} cityName={cityName} reach={reach} onClose={() => setOpen(false)} />, document.body) : null}
    </>
  );
}

function AdEnquiry({ city, cityName, reach, onClose }: { city: string; cityName: string; reach: string; onClose: () => void }) {
  const [f, setF] = useState({ biz: "", name: "", phone: "", email: "", msg: "" });
  const [err, setErr] = useState<{ biz?: boolean; phone?: boolean; email?: boolean }>({});
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  const up = (k: keyof typeof f, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setErr((e) => ({ ...e, [k]: false }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const e = {
      biz: !f.biz.trim(),
      phone: (f.phone.match(/\d/g) || []).length < 10 || !/^\+?[\d\s-]+$/.test(f.phone.trim()),
      email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()),
    };
    setErr(e);
    if (e.biz || e.phone || e.email) return;
    setBusy(true);
    setSaveErr("");
    try {
      const response = await fetch("/api/advertise", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, city }) });
      if (!response.ok) throw new Error();
      setDone(true);
    } catch {
      setSaveErr("That didn’t send. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const lab = (text: string, k: string, req?: boolean) => (
    <label className="ae-lab" htmlFor={`ae-${k}`}>
      {text}
      {req ? <span className="ae-req"> *</span> : null}
    </label>
  );
  return (
    <div className="ae-scrim" role="dialog" aria-modal="true" aria-label="Advertise with us" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ae-card">
        <div className="ae-grab" />
        <button type="button" className="ae-x" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={16} stroke={2.6} />
        </button>
        {done ? (
          <div className="ae-done">
            <span className="ae-done__ic">
              <Icon name="check" size={30} stroke={2.6} />
            </span>
            <b>Thanks, {f.biz.trim()}!</b>
            <p>
              We’ve got your details and will get in touch on {f.phone.trim()} or {f.email.trim()}.
            </p>
            <button type="button" className="ae-done__btn" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="ae-k">ADVERTISE ON HALAL LIVING</div>
            <div className="ae-h">
              Reach {reach} people a month in {cityName}
            </div>
            <div className="ae-s">Share your details and we’ll get in touch by phone or email.</div>
            {lab("Business name", "biz", true)}
            <input id="ae-biz" className="ae-in" aria-invalid={Boolean(err.biz)} value={f.biz} placeholder="e.g. Al-Barakah Meats" autoComplete="organization" onChange={(e) => up("biz", e.target.value)} />
            {err.biz ? <div className="ae-err">Add your business name.</div> : null}
            {lab("Your name", "name")}
            <input id="ae-name" className="ae-in" value={f.name} placeholder="Who should we ask for?" autoComplete="name" onChange={(e) => up("name", e.target.value)} />
            {lab("Phone number", "phone", true)}
            <input id="ae-phone" className="ae-in" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(err.phone)} value={f.phone} placeholder="+91 98765 43210" onChange={(e) => up("phone", e.target.value)} />
            {err.phone ? <div className="ae-err">Enter a phone number with at least 10 digits.</div> : null}
            {lab("Email", "email", true)}
            <input id="ae-email" className="ae-in" type="email" inputMode="email" autoComplete="email" aria-invalid={Boolean(err.email)} value={f.email} placeholder="you@business.com" onChange={(e) => up("email", e.target.value)} />
            {err.email ? <div className="ae-err">Enter a valid email address.</div> : null}
            {lab("Anything you’d like us to know? (optional)", "msg")}
            <textarea id="ae-msg" className="ae-in ae-ta" rows={3} value={f.msg} placeholder="What you’d like to promote" onChange={(e) => up("msg", e.target.value)} />
            <button type="submit" className="ae-go" disabled={busy}>
              {busy ? "Sending…" : "Send enquiry"}
              {busy ? null : <Icon name="arrowRight" size={16} stroke={2.6} />}
            </button>
            {saveErr ? (
              <div className="ae-err" role="alert">
                {saveErr}
              </div>
            ) : null}
            <div className="ae-fine">We only use these details to reply about advertising.</div>
          </form>
        )}
      </div>
    </div>
  );
}

export type AdSlide = { id: string; href: string; label: string; name: string; pitch: string; cta: string; art: string; bg: string };

/** Mockup .hl-ads: sponsored banners slide every 5 s (paused on hover), with progress dots. */
export function AdCarousel({ ads }: { ads: AdSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (ads.length < 2 || paused) return;
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
