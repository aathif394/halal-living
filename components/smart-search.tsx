"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icons";

// Mockup SmartSearch: typing placeholder; on desktop a dropdown under the pill, on phones a full-screen sheet.
// Fuzzy matches places, dishes and areas, keeps recent searches on this device, and suggests a spelling.

export type SearchPlace = { type: "r" | "m"; name: string; sub: string; href: string };
export type SearchDish = { name: string; count: number };

type Item = { kind: "place"; place: SearchPlace } | { kind: "dish"; dish: SearchDish } | { kind: "area"; area: string } | { kind: "text"; text: string };

const RECENT_KEY = "hl_recent";

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function lev(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
}

function score(hay: string, q: string) {
  const H = norm(hay);
  const Q = norm(q);
  if (!Q) return 0;
  if (H.startsWith(Q)) return 100;
  const words = H.split(" ");
  if (words.some((w) => w.startsWith(Q))) return 85;
  if (H.includes(Q)) return 70;
  const qw = Q.split(" ").filter(Boolean);
  let hit = 0;
  for (const x of qw) {
    if (words.some((w) => w.startsWith(x))) {
      hit += 1;
      continue;
    }
    const tol = x.length > 6 ? 2 : x.length > 3 ? 1 : 0;
    if (tol && words.some((w) => w[0] === x[0] && (lev(w.slice(0, x.length + 1), x) <= tol || lev(w, x) <= tol))) hit += 0.8;
  }
  return hit >= qw.length * 0.8 ? 40 + hit : hit > 0 && qw.length > 1 ? 20 + hit : 0;
}

function readRecent(): string[] {
  try {
    return (JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[]).slice(0, 5);
  } catch {
    return [];
  }
}

export function SmartSearch({
  city,
  cityName,
  places,
  dishes,
  areas,
  examples,
}: {
  city: string;
  cityName: string;
  places: SearchPlace[];
  dishes: SearchDish[];
  areas: { name: string; count: number }[];
  examples: string[];
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [ph, setPh] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [mob, setMob] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const box = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const sheetInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(readRecent());
    const mq = window.matchMedia("(max-width: 1099px)");
    const update = () => setMob(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Typing placeholder (55 ms per letter, pause, delete, next example).
  useEffect(() => {
    if (examples.length === 0) {
      setPh(examples[0] ?? "");
      return;
    }
    let i = 0;
    let n = 0;
    let dir = 1;
    let wait = 4;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const w = examples[i % examples.length] ?? "";
      if (wait > 0) {
        wait--;
        return;
      }
      n += dir;
      if (n >= w.length) {
        n = w.length;
        dir = -1;
        wait = 30;
      } else if (n <= 0) {
        n = 0;
        dir = 1;
        i++;
        wait = 6;
      }
      setPh(w.slice(0, n));
    }, 55);
    return () => window.clearInterval(id);
  }, [examples]);

  useEffect(() => setHi(-1), [q]);

  const groups = useMemo(() => {
    if (!norm(q)) return null;
    const ranked = places
      .map((place) => ({ place, s: Math.max(score(place.name, q), score(place.sub, q) * 0.7) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);
    const out: { title: string; items: Item[] }[] = [];
    const dishHits = dishes
      .map((dish) => ({ dish, s: score(dish.name, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    if (dishHits.length) out.push({ title: "DISHES & CUISINES", items: dishHits.map(({ dish }) => ({ kind: "dish", dish })) });
    const rest = ranked.filter((r) => r.place.type === "r").slice(0, 4);
    const mas = ranked.filter((r) => r.place.type === "m").slice(0, 4);
    if (rest.length) out.push({ title: "RESTAURANTS", items: rest.map(({ place }) => ({ kind: "place", place })) });
    if (mas.length) out.push({ title: "MASJIDS & PRAYER HALLS", items: mas.map(({ place }) => ({ kind: "place", place })) });
    const areaHits = areas
      .map((area) => ({ area, s: score(area.name, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    if (areaHits.length) {
      const g = { title: "AREAS", items: areaHits.map(({ area }) => ({ kind: "area", area: area.name }) as Item) };
      if (areaHits[0]!.s >= 85) out.unshift(g);
      else out.push(g);
    }
    return out;
  }, [q, places, dishes, areas]);

  const flat: Item[] = groups ? groups.flatMap((g) => g.items) : [...recent.map((text) => ({ kind: "text", text }) as Item), ...examples.map((text) => ({ kind: "text", text }) as Item)];

  const didYouMean = useMemo(() => {
    const Q = norm(q);
    if (Q.length < 4 || (groups && groups.length)) return null;
    let best: string | null = null;
    let bd = 99;
    for (const name of [...places.map((p) => p.name), ...dishes.map((d) => d.name), ...areas.map((a) => a.name)]) {
      for (const w of [...norm(name).split(" "), norm(name)]) {
        const d = lev(w.slice(0, Q.length + 2), Q);
        if (d < bd) {
          bd = d;
          best = name;
        }
      }
    }
    return bd <= Math.max(1, Math.floor(Q.length / 3)) ? best : null;
  }, [q, groups, places, dishes, areas]);

  const remember = (label: string) => {
    const next = [label, ...recent.filter((x) => x !== label)].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Private mode.
    }
  };

  const close = () => {
    setOpen(false);
    setHi(-1);
    input.current?.blur();
  };

  const go = (href: string) => window.location.assign(href);

  const pick = (item: Item | undefined) => {
    if (!item) return;
    if (item.kind === "place") {
      remember(item.place.name);
      close();
      go(item.place.href);
    } else if (item.kind === "dish") {
      remember(item.dish.name);
      close();
      go(`/${city}/restaurants?q=${encodeURIComponent(item.dish.name)}`);
    } else if (item.kind === "area") {
      remember(item.area);
      close();
      go(`/${city}/restaurants?area=${encodeURIComponent(item.area)}`);
    } else {
      setQ(item.text);
      setOpen(true);
    }
  };

  const submit = () => {
    if (hi >= 0 && flat[hi]) return pick(flat[hi]);
    const v = q.trim();
    if (!v) return;
    remember(v);
    close();
    go(`/${city}/restaurants?q=${encodeURIComponent(v)}`);
  };

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHi((i) => Math.min(flat.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHi((i) => Math.max(-1, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") close();
  };

  // Desktop dropdown follows the pill.
  useEffect(() => {
    if (mob || !open) return;
    const update = () => {
      const r = box.current?.getBoundingClientRect();
      if (r) setPos({ left: r.left + window.scrollX, top: r.bottom + window.scrollY + 10, width: r.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, mob]);

  // Phone sheet: lock scroll, focus, Escape.
  useEffect(() => {
    if (!mob || !open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => sheetInput.current?.focus(), 60);
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = overflow;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onEsc);
    };
  }, [mob, open]);

  const mark = (text: string) => {
    const v = q.trim();
    const i = v ? text.toLowerCase().indexOf(v.toLowerCase()) : -1;
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark>{text.slice(i, i + v.length)}</mark>
        {text.slice(i + v.length)}
      </>
    );
  };

  const row = (item: Item, idx: number, main: React.ReactNode, sub: string | null, icon: IconName, tone: "brand" | "gold" | "plain") => (
    <button
      key={idx}
      type="button"
      role="option"
      aria-selected={idx === hi}
      className={`ss-row${idx === hi ? " is-hi" : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => !mob && setHi(idx)}
      onClick={() => pick(item)}
    >
      <span className={`ss-ic ss-ic--${tone}`}>
        <Icon name={icon} size={18} stroke={1.9} />
      </span>
      <span className="ss-t">
        <b>{main}</b>
        {sub ? <small>{sub}</small> : null}
      </span>
    </button>
  );

  let idx = -1;
  const body = groups ? (
    flat.length ? (
      <div>
        {groups.map((g) => (
          <div key={g.title}>
            <div className="ss-head">{g.title}</div>
            {g.items.map((item) => {
              idx++;
              if (item.kind === "place") return row(item, idx, mark(item.place.name), item.place.sub, item.place.type === "r" ? "food" : "masjid", item.place.type === "r" ? "brand" : "gold");
              if (item.kind === "dish") return row(item, idx, mark(item.dish.name), `${item.dish.count} ${item.dish.count === 1 ? "restaurant" : "restaurants"} in ${cityName}`, "food", "plain");
              if (item.kind === "area") {
                const n = areas.find((a) => a.name === item.area)?.count ?? 0;
                return row(item, idx, mark(item.area), `${n} ${n === 1 ? "place" : "places"}`, "pin", "plain");
              }
              return null;
            })}
          </div>
        ))}
        <button type="button" className="ss-all" onMouseDown={(e) => e.preventDefault()} onClick={submit}>
          See all results for “{q.trim()}”
          <Icon name="arrowRight" size={14} stroke={2.6} />
        </button>
      </div>
    ) : (
      <div className="ss-none">
        <b>No matches for “{q.trim()}”</b>
        {didYouMean ? (
          <button type="button" className="ss-dym" onMouseDown={(e) => e.preventDefault()} onClick={() => setQ(didYouMean)}>
            Did you mean {didYouMean}?
          </button>
        ) : null}
        <p>Know this place? Tell us and someone from the community will check it.</p>
        <a className="ss-suggest" href={`/${city}#suggest`} onClick={close}>
          Suggest a place
        </a>
      </div>
    )
  ) : (
    <div>
      {recent.length ? (
        <div className="ss-headrow">
          <div className="ss-head">RECENT</div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setRecent([]);
              try {
                localStorage.removeItem(RECENT_KEY);
              } catch {
                // Private mode.
              }
            }}
          >
            Clear
          </button>
        </div>
      ) : null}
      {recent.map((text) => {
        idx++;
        return row({ kind: "text", text }, idx, text, null, "clock", "plain");
      })}
      <div className="ss-head">POPULAR IN {cityName.toUpperCase()}</div>
      {examples.map((text) => {
        idx++;
        return row({ kind: "text", text }, idx, text, null, "sparkle", "plain");
      })}
    </div>
  );

  return (
    <form
      ref={box}
      className={`hl-search${open && !mob ? " is-focus" : ""}`}
      action={`/${city}/restaurants`}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <span className="hl-search__ic">
        <Icon name="search" size={20} stroke={2.4} />
      </span>
      <input
        ref={input}
        name="q"
        value={q}
        onChange={(event) => {
          setQ(event.target.value);
          setOpen(true);
        }}
        onFocus={(event) => {
          setOpen(true);
          if (mob) event.currentTarget.blur();
        }}
        onClick={() => setOpen(true)}
        onBlur={() => !mob && window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKey}
        placeholder={`${ph}|`}
        aria-label={`Search restaurants, masjids, dishes or areas in ${cityName}`}
        aria-autocomplete="list"
        aria-expanded={open}
        enterKeyHint="search"
        autoComplete="off"
        readOnly={mob}
      />
      {q && !mob ? (
        <button type="button" className="ss-clear" aria-label="Clear" onMouseDown={(e) => e.preventDefault()} onClick={() => (setQ(""), input.current?.focus())}>
          <Icon name="close" size={14} stroke={2.6} />
        </button>
      ) : null}
      {open && !mob && pos
        ? createPortal(
            <div className="ss-drop" role="listbox" style={{ left: pos.left, top: pos.top, width: Math.max(pos.width, 520) }}>
              {body}
            </div>,
            document.body,
          )
        : null}
      {open && mob
        ? createPortal(
            <div className="ss-sheet" role="dialog" aria-modal="true" aria-label="Search">
              <div className="ss-sheet__bar">
                <button type="button" className="ss-back" aria-label="Back" onClick={close}>
                  <Icon name="chevronLeft" size={18} stroke={2.4} />
                </button>
                <div className="ss-sheet__in">
                  <Icon name="search" size={17} stroke={2.2} />
                  <input
                    ref={sheetInput}
                    value={q}
                    enterKeyHint="search"
                    placeholder="Dish, place, masjid or area"
                    aria-label="Search"
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={onKey}
                  />
                  {q ? (
                    <button type="button" aria-label="Clear" onClick={() => (setQ(""), sheetInput.current?.focus())}>
                      <Icon name="close" size={14} stroke={2.6} />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="ss-sheet__body" role="listbox">
                {body}
              </div>
            </div>,
            document.body,
          )
        : null}
    </form>
  );
}
