"use client";

import { useEffect, useState } from "react";

export function WordCycle({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 1800);
    return () => window.clearInterval(timer);
  }, [words.length]);
  return <span className="hl-soft">{words[index]}</span>;
}
