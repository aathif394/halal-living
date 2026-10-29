"use client";

import { useEffect } from "react";
import { errorWatch, focusTrap, halalNote, installSheet, stickyHeaders, switchIndicator } from "./addons";
import Logic from "./home-logic";
import { makeHost } from "./runtime";
import View from "./home-view";
import type { AppData } from "@/lib/app-data";

const Home = makeHost("Halal Living", Logic, View, (logic, props) => {
  const hlc = props.hlc as AppData;
  const boot = hlc.boot;
  if (boot.notFound) logic.state = { ...logic.state, notFound: "/" };
  if (!boot.slug || !boot.kind) return;
  const pack = hlc.byCity[hlc.city];
  const list: { slug: string; name: string }[] = boot.kind === "masjids" ? pack.masjids : pack.restaurants;
  const found = list.find((item) => item.slug === boot.slug);
  if (!found) return;
  const masjid = boot.kind === "masjids";
  logic.state = { ...logic.state, view: masjid ? "mas" : "rest", detail: { type: masjid ? "m" : "r", idx: 0, name: found.name } };
  (logic as unknown as { __detail: unknown }).__detail = found;
}, (logic, props) => {
  if ((props.hlc as AppData).boot.open === "ad") logic.setState({ adForm: true });
});

let addonsStarted = false;

export function HalalApp({ hlc }: { hlc: AppData }) {
  useEffect(() => {
    if (addonsStarted) return;
    addonsStarted = true;
    for (const run of [focusTrap, errorWatch, switchIndicator, stickyHeaders, halalNote, installSheet]) {
      try {
        run();
      } catch (e) {
        console.error(e);
      }
    }
  }, []);
  return (
    <div id="dc-root">
      <Home hlc={hlc} />
    </div>
  );
}
