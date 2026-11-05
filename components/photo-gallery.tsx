"use client";

import { PlaceImage } from "./place-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/lib/view";
import { Icon } from "./icons";

function PhotoLightbox({
  photos,
  name,
  index,
  setIndex,
  close,
}: {
  photos: Photo[];
  name: string;
  index: number;
  setIndex: (index: number) => void;
  close: () => void;
}) {
  const startX = useRef(0);
  const go = useCallback(
    (delta: number) => setIndex((index + delta + photos.length) % photos.length),
    [index, photos.length, setIndex],
  );

  useEffect(() => {
    const overflow = document.body.style.overflow;
    const playing = [...document.querySelectorAll("video")].filter((v) => !v.paused);
    playing.forEach((v) => v.pause());
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      playing.filter((v) => v.isConnected).forEach((v) => v.play().catch(() => {}));
    };
  }, [close, go]);

  const photo = photos[index]!;

  return createPortal(
    <div
      className="hl-lightbox is-open"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photos`}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <header className="hl-lightbox__head">
        <h2>{name}</h2>
        <span aria-live="polite">
          {index + 1} / {photos.length}
        </span>
        <button type="button" onClick={close} aria-label="Close photos" autoFocus>
          <Icon name="close" size={24} />
        </button>
      </header>
      <div
        className="hl-lightbox__stage"
        onTouchStart={(event) => {
          startX.current = event.touches[0]!.clientX;
        }}
        onTouchEnd={(event) => {
          const distance = event.changedTouches[0]!.clientX - startX.current;
          if (Math.abs(distance) > 50) go(distance < 0 ? 1 : -1);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <img key={photo.src} src={photo.src} alt={`${name}, photo ${index + 1}`} />
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              className="hl-lightbox__prev"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              <Icon name="chevronLeft" size={28} />
            </button>
            <button
              type="button"
              className="hl-lightbox__next"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              <Icon name="chevronRight" size={28} />
            </button>
          </>
        ) : null}
      </div>
      <footer className="hl-lightbox__foot">
        <span>{photo.credit}</span>
        <a href={photo.src} target="_blank" rel="noopener noreferrer">
          Open full-size photo
          <Icon name="arrowUpRight" size={14} />
        </a>
      </footer>
    </div>,
    document.body,
  );
}

export function PhotoGallery({
  photos,
  art,
  name,
  variant,
}: {
  photos: Photo[];
  art: string;
  name: string;
  variant: "grid" | "strip";
}) {
  const [index, setIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const list = photos.length ? photos : [{ src: art, credit: "Illustration" }];

  return (
    <>
      <div className={variant === "grid" ? "hl-photos__grid" : "hl-sheet__gallery"}>
        {list.slice(0, variant === "grid" ? 6 : 4).map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            className={`${variant === "grid" ? "hl-photos__cell " : ""}hl-photo-trigger`}
            onClick={() => setIndex(i)}
            aria-label={`Open photo ${i + 1} of ${name}`}
            title={photo.credit || undefined}
          >
            <PlaceImage src={photo.src} alt={`${name}, photo ${i + 1}`} width={640} height={480} sizes="(min-width: 1100px) 360px, 50vw" />
          </button>
        ))}
      </div>
      {mounted && index >= 0 ? (
        <PhotoLightbox
          photos={list}
          name={name}
          index={index}
          setIndex={setIndex}
          close={() => setIndex(-1)}
        />
      ) : null}
    </>
  );
}
