"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void> };

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("hl-install-dismissed")) setDismissed(true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    const onInstallClick = () => {
      if (deferred) deferred.prompt();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("hl:install", onInstallClick);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("hl:install", onInstallClick);
    };
  }, [deferred]);

  if (!deferred || dismissed) return null;

  return (
    <div className="hl-install-card" role="status">
      <img src="/icons/icon-192.png" alt="" width="40" height="40" style={{ borderRadius: 12, flex: "none" }} />
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block" }}>Install Halal Living</strong>
        <span style={{ fontSize: 13, opacity: 0.8 }}>Faster, full-screen, works offline.</span>
      </div>
      <button
        type="button"
        className="install"
        onClick={() => {
          deferred.prompt();
          setDeferred(null);
        }}
      >
        Install
      </button>
      <button
        type="button"
        className="dismiss"
        aria-label="Dismiss"
        onClick={() => {
          sessionStorage.setItem("hl-install-dismissed", "1");
          setDismissed(true);
        }}
      >
        ×
      </button>
    </div>
  );
}
