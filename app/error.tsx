"use client";

import { useEffect } from "react";
import { ERROR_HTML } from "@/components/hl/static-html";

export default function ErrorPage({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-hl-error] #hl-error");
    if (!el) return;
    el.hidden = false;
    const ref = el.querySelector("#he-ref");
    if (ref) ref.textContent = error.digest || "render";
    el.querySelector("#he-reload")?.addEventListener("click", () => location.reload());
    el.querySelector("#he-home")?.addEventListener("click", () => location.assign("/"));
  }, [error]);
  return <div data-hl-error="" dangerouslySetInnerHTML={{ __html: ERROR_HTML }} />;
}
