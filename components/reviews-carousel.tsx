"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReviewView } from "@/lib/view";
import { Icon, Stars } from "./icons";

export function ReviewsCarousel({ reviews }: { reviews: ReviewView[] }) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: reviews.length < 2 });

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const measure = () => setEdges({ start: node.scrollLeft <= 1, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1 });
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => { node.removeEventListener("scroll", measure); observer.disconnect(); };
  }, [reviews]);

  const move = (direction: number) => {
    const node = track.current;
    const card = node?.firstElementChild;
    if (!node || !card) return;
    node.scrollBy({ left: direction * (card.getBoundingClientRect().width + 12), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  if (!reviews.length) return <p className="hl-muted">No Google reviews are linked for this place yet.</p>;
  return (
    <div className="hl-review-carousel">
      <div id={id} ref={track} className="hl-review-track" tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Google reviews" onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
      }}>
        {reviews.map((review, i) => (
          <article key={i} className="hl-review" aria-label={`Review ${i + 1} of ${reviews.length}`}>
            <div className="hl-review__head">
              <span className="hl-review__av" style={{ background: review.color }}>{review.initial}</span>
              <span className="hl-review__who"><b title={review.name}>{review.name}</b><small>{review.when}</small></span>
              {review.rating ? <Stars value={review.rating} size={11} /> : null}
            </div>
            <p>{review.text}</p>
          </article>
        ))}
      </div>
      {reviews.length > 1 ? <div className="hl-review-controls">
        <button type="button" aria-label="Previous reviews" aria-controls={id} disabled={edges.start} onClick={() => move(-1)}><Icon name="arrowLeft" size={18} /></button>
        <button type="button" aria-label="Next reviews" aria-controls={id} disabled={edges.end} onClick={() => move(1)}><Icon name="arrowRight" size={18} /></button>
      </div> : null}
    </div>
  );
}
