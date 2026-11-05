"use client";

import { useEffect, useState } from "react";
import type { Traffic } from "@/lib/traffic";
import { CountUp } from "./motion";

export function TrafficCard({ city, initial }: { city: string; initial: Traffic | null }) {
  const [traffic, setTraffic] = useState(initial);
  useEffect(() => {
    let live = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/traffic");
        if (response.ok && live) {
          const data = (await response.json()) as Traffic;
          if (data && data.counts) setTraffic(data);
        }
      } catch {
        /* Keep the measured snapshot and its visible timestamp. */
      }
    };
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 300000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="hl-live-card">
      <span className="hl-live-card__c1" aria-hidden="true" />
      <span className="hl-live-card__c2" aria-hidden="true" />
      <span className="hl-live">
        <i />
        {traffic ? "Measured" : "Analytics unavailable"}
      </span>
      <b className="hl-live-card__n">
        {traffic ? <CountUp key={traffic.counts[city]} value={traffic.counts[city] ?? 0} /> : "—"}
      </b>
      <span className="hl-live-card__l">page views this month</span>
    </div>
  );
}
