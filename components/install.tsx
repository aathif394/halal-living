"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

type InstallApi = { open: () => void; standalone: boolean };

const InstallContext = createContext<InstallApi>({ open: () => {}, standalone: false });

export function useInstall() {
  return useContext(InstallContext);
}

const LATER_KEY = "hl-pwa-later";

function readLater(): number {
  try {
    return Number(localStorage.getItem(LATER_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeLater() {
  try {
    localStorage.setItem(LATER_KEY, String(Date.now()));
  } catch {
    // Private mode: the sheet may be offered again next visit.
  }
}

function isStandalone() {
  try {
    return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

function isIos() {
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const deferred = useRef<PromptEvent | null>(null);
  const [sheet, setSheet] = useState<null | "offer" | "steps">(null);
  const [standalone, setStandalone] = useState(false);
  const [toast, setToast] = useState("");

  const say = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    setStandalone(isStandalone());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferred.current = event as PromptEvent;
    };
    const onInstalled = () => {
      deferred.current = null;
      setSheet(null);
      say("Halal Living is on your home screen");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    // Offer it once on phones after the visitor has looked around; ask again 14 days after "Maybe later".
    const start = Date.now();
    let timer = 0;
    const maybe = () => {
      if (isStandalone() || window.innerWidth >= 1100) return;
      if (Date.now() - readLater() < 14 * 864e5) return;
      if (document.querySelector("[role=dialog][aria-modal=true]")) return;
      if (!deferred.current && !isIos()) {
        if (Date.now() - start < 60000) timer = window.setTimeout(maybe, 5000);
        return;
      }
      setSheet((current) => current ?? "offer");
    };
    timer = window.setTimeout(maybe, 12000);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, [say]);

  const open = useCallback(() => {
    if (isStandalone()) {
      say("You already have the app open");
      return;
    }
    const nav = navigator as Navigator & { install?: () => Promise<unknown> };
    setSheet(isIos() && typeof nav.install !== "function" ? "steps" : "offer");
  }, [say]);

  const install = useCallback(() => {
    setSheet(null);
    const nav = navigator as Navigator & { install?: () => Promise<unknown> };
    const fallback = () => window.setTimeout(() => setSheet("steps"), 300);
    const native = () => {
      const event = deferred.current!;
      deferred.current = null;
      event.prompt();
      (event.userChoice ?? Promise.resolve({ outcome: "" })).then((choice) => {
        if (choice.outcome === "accepted") say("Installing Halal Living…");
        else writeLater();
      });
    };
    try {
      if (typeof nav.install === "function") {
        nav.install().then(() => say("Installing Halal Living…"), fallback);
        return;
      }
    } catch {
      // Fall through to the beforeinstallprompt path.
    }
    if (deferred.current) {
      native();
      return;
    }
    // The browser can be a moment late in saying it is ready; wait briefly before showing manual steps.
    let waited = 0;
    const poll = window.setInterval(() => {
      waited += 150;
      if (deferred.current) {
        window.clearInterval(poll);
        native();
      } else if (waited >= 1500) {
        window.clearInterval(poll);
        fallback();
      }
    }, 150);
  }, [say]);

  return (
    <InstallContext.Provider value={{ open, standalone }}>
      {children}
      {sheet ? (
        <InstallSheet
          steps={sheet === "steps"}
          onClose={(later) => {
            if (later) writeLater();
            setSheet(null);
          }}
          onInstall={install}
        />
      ) : null}
      {toast ? (
        <div className="hl-toast" role="status">
          {toast}
        </div>
      ) : null}
    </InstallContext.Provider>
  );
}

function InstallSheet({ steps, onClose, onInstall }: { steps: boolean; onClose: (later: boolean) => void; onInstall: () => void }) {
  const [shown, setShown] = useState(false);
  const [dy, setDy] = useState(0);
  const [ios, setIos] = useState(false);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const close = useCallback(
    (later: boolean) => {
      setShown(false);
      window.setTimeout(() => onClose(later), 400);
    },
    [onClose],
  );

  useEffect(() => {
    setIos(isIos());
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    const back = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      back?.focus?.({ preventScroll: true });
    };
  }, [close]);

  const stepList = ios
    ? [
        [<>Tap <b>Share</b> in Safari’s toolbar</>, "iosShare"],
        [<>Choose <b>Add to Home Screen</b></>, "plusSquare"],
        [<>Tap <b>Add</b> in the top corner</>, "check"],
      ]
    : [
        [<>Open your browser menu</>, "info"],
        [<>Tap <b>Install app</b> or <b>Add to Home screen</b></>, "plusSquare"],
        [<>Confirm with <b>Install</b></>, "check"],
      ];

  return (
    <div className={`hl-pwa-scrim${shown ? " on" : ""}`} onClick={(event) => event.target === event.currentTarget && close(true)}>
      <div
        ref={sheetRef}
        className={`hl-pwa-sheet${dragging ? " drag" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hlp-h"
        tabIndex={-1}
        style={{ transform: shown ? `translateY(${dy}px)` : undefined }}
      >
        <div
          className="hlp-band"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            start.current = event.clientY;
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (start.current != null) setDy(Math.max(0, event.clientY - start.current));
          }}
          onPointerUp={() => {
            start.current = null;
            setDragging(false);
            if (dy > 90) close(true);
            setDy(0);
          }}
          onPointerCancel={() => {
            start.current = null;
            setDragging(false);
            setDy(0);
          }}
        >
          <div className="hlp-grab" />
          <button type="button" className="hlp-x" aria-label="Close" onClick={() => close(true)}>
            <Icon name="close" size={16} stroke={2.6} />
          </button>
          <div className="hlp-phone" aria-hidden="true">
            <i />
            <img alt="" src="/icons/icon-192.png" />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="hlp-body">
          <p className="hlp-h" id="hlp-h">
            {steps ? "Add Halal Living to your home screen" : "Get the Halal Living app"}
          </p>
          <p className="hlp-s">{steps ? (ios ? "Takes 10 seconds in Safari." : "Takes 10 seconds from your browser menu.") : "Free, tiny, and no app store needed."}</p>
          {steps ? (
            <ol className="hlp-steps">
              {stepList.map(([text, icon], i) => (
                <li key={i}>
                  <span>{text}</span>
                  <em>
                    <Icon name={icon as "check"} size={17} />
                  </em>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="hlp-perks">
              <li>
                <span>
                  <Icon name="bolt" />
                </span>
                Opens in one tap, full screen
              </li>
              <li>
                <span>
                  <Icon name="pin" />
                </span>
                Masjid locator always at hand
              </li>
              <li>
                <span>
                  <Icon name="wifi" />
                </span>
                Loads fast, even on weak signal
              </li>
            </ul>
          )}
          <button type="button" className="hlp-go" onClick={steps ? () => close(false) : onInstall}>
            <Icon name={steps ? "check" : "download"} size={20} stroke={2.4} />
            {steps ? "Got it" : "Install app"}
          </button>
          {steps ? null : (
            <button type="button" className="hlp-no" onClick={() => close(true)}>
              Maybe later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Animated install card on the mobile home page: the icon drops onto a phone, rests, then replays. */
export function InstallCard() {
  const { open, standalone } = useInstall();
  const ref = useRef<HTMLButtonElement>(null);
  // All animation state lives in React (a class added by hand would be wiped on the next render).
  // runId > 0 means the drop is playing; bumping it remounts the art so the drop starts from the top.
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);

  // The drop starts once the card is clear of the top bar and the bottom bar and the launch screen
  // has gone, and replays from the top each time the card comes back into view.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let wasIn = false;
    let frame = 0;
    const check = () => {
      frame = 0;
      if (document.documentElement.classList.contains("hl-launching")) return;
      const r = node.getBoundingClientRect();
      const top = 64;
      const bottom = window.innerHeight - 76;
      const visible = Math.max(0, Math.min(r.bottom, bottom) - Math.max(r.top, top));
      const isIn = r.height > 0 && visible / r.height >= 0.8;
      const onScreen = r.bottom > 0 && r.top < window.innerHeight;
      if (isIn && !wasIn) setRunId((x) => x + 1);
      wasIn = isIn;
      setPaused(!onScreen);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      mo.disconnect();
    };
  }, []);

  if (standalone) return null;
  return (
    <button ref={ref} type="button" className={`hla${runId ? " is-run" : ""}${paused ? " hla-off" : ""}`} aria-label="Get the Halal Living app" onClick={open}>
      <span className="hla-txt">
        <span className="hla-k">Halal Living app</span>
        <span className="hla-h">Your city’s halal guide, one tap away</span>
        <span className="hla-btn">
          <Icon name="download" size={15} stroke={2.4} />
          Install free
        </span>
      </span>
      <span key={runId} className="hla-art" aria-hidden="true">
        <span className="hla-ph">
          <span className="hla-notch" />
          <span className="hla-grid">
            <i />
            <i />
            <i />
            <i />
            <b className="hla-cell">
              <b className="hla-slot" />
              <img className="hla-ic" src="/icons/icon-192.png" alt="" />
            </b>
            <i />
            <i />
            <i />
            <i />
          </span>
        </span>
        <span className="hla-sp hla-sp1" />
        <span className="hla-sp hla-sp2" />
        <span className="hla-sp hla-sp3" />
        <span className="hla-ok">
          <Icon name="check" size={12} stroke={3} />
          Added
        </span>
      </span>
    </button>
  );
}

export function InstallLink({ className }: { className?: string }) {
  const { open } = useInstall();
  return (
    <button type="button" className={className} onClick={open}>
      Install the app
    </button>
  );
}
