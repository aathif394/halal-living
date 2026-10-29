"use client";

import { useState } from "react";

export function SubscribeWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (status === "sent") {
    return (
      <div className="hl-subscribe-card" role="status">
        <strong>You&rsquo;re on the list.</strong>
        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>We&rsquo;ll email new halal spots near you.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="hl-subscribe-btn" onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7l9 6 9-6M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
        </svg>
        Stay updated
      </button>
    );
  }

  return (
    <form
      className="hl-subscribe-card"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("sending");
        const email = new FormData(event.currentTarget).get("email");
        try {
          const response = await fetch("/api/subscribe", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email }),
          });
          setStatus(response.ok ? "sent" : "error");
        } catch {
          setStatus("error");
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
        <strong>Stay updated</strong>
        <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ border: 0, background: "none", cursor: "pointer", fontSize: 18 }}>
          ×
        </button>
      </div>
      <p style={{ margin: "6px 0 14px", color: "var(--muted)" }}>New halal restaurants and masjids, straight to your inbox.</p>
      <input
        type="email"
        name="email"
        required
        placeholder="you@email.com"
        aria-label="Email address"
        style={{ width: "100%", height: 46, border: "1px solid var(--line)", borderRadius: 12, padding: "0 14px", boxSizing: "border-box" }}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        style={{ marginTop: 10, width: "100%", height: 46, border: 0, borderRadius: 12, background: "var(--btn)", color: "#fff", fontWeight: 800, cursor: "pointer" }}
      >
        {status === "sending" ? "Sending…" : "Subscribe"}
      </button>
      {status === "error" ? <p style={{ color: "#b3261e", marginTop: 8 }}>That didn&rsquo;t send. Try again.</p> : null}
    </form>
  );
}
