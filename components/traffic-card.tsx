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
          if (data?.counts && live) {
            setTraffic((current) => current && current.updatedAt > data.updatedAt ? current : data);
          }
        }
      } catch {
        /* Keep the last measurement if the refresh fails. */
      }
    };
    void refresh();
    const refreshIfVisible = () => {
      if (!document.hidden) void refresh();
    };
    const timer = window.setInterval(refreshIfVisible, 300000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      live = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, []);

  return (
    <div className="hl-live-card">
      <span className="hl-live-card__c1" aria-hidden="true" />
      <span className="hl-live-card__c2" aria-hidden="true" />
      {!traffic && <span className="hl-live">Analytics unavailable</span>}
      <b className="hl-live-card__n">
        {traffic ? <CountUp key={traffic.counts[city]} value={traffic.counts[city] ?? 0} /> : "—"}
      </b>
      <span className="hl-live-card__l">page views this month</span>
    </div>
  );
}
