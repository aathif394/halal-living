"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

function isElementVisible(el: HTMLElement | null): boolean {
  if (!el || typeof window === "undefined") return false;
  if (typeof el.checkVisibility === "function") {
    if (!el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })) {
      return false;
    }
  }
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  return true;
}

function pauseOtherVideos(current: HTMLVideoElement) {
  if (typeof document === "undefined") return;
  document.querySelectorAll("video").forEach((other) => {
    if (other !== current && !other.paused) {
      other.pause();
    }
  });
}

/**
 * Autoplays reel video with sound.
 * Attempts unmuted playback first. If the browser blocks unmuted autoplay,
 * it immediately plays muted so the video is playing without delay, and unlocks
 * audio on the user's first gesture anywhere on the page.
 */
export function useReelPlayback(
  video: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  muted: boolean,
  source: string,
  onMuteChange?: (muted: boolean) => void,
) {
  const [blocked, setBlocked] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Sync muted property directly to DOM element
  useEffect(() => {
    const node = video.current;
    if (node) {
      node.muted = muted;
    }
  }, [video, muted]);

  const attemptPlay = useCallback(async () => {
    const node = video.current;
    if (!node) return;

    if (!isElementVisible(node)) {
      node.pause();
      return;
    }

    pauseOtherVideos(node);
    node.muted = mutedRef.current;
    try {
      await node.play();
      setBlocked(false);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === "NotAllowedError") {
        if (!mutedRef.current) {
          try {
            node.muted = true;
            await node.play();
            setBlocked(true);
          } catch {
            setBlocked(true);
          }
        } else {
          setBlocked(true);
        }
      }
    }
  }, [video]);

  useEffect(() => {
    const node = video.current;
    if (!node) return;

    if (!enabled || !isElementVisible(node)) {
      node.pause();
      return;
    }

    let active = true;
    const run = () => {
      if (active) void attemptPlay();
    };

    run();
    node.addEventListener("canplay", run);
    return () => {
      active = false;
      node.removeEventListener("canplay", run);
    };
  }, [enabled, source, attemptPlay, video]);

  // Unlock sound on first user gesture anywhere on page
  useEffect(() => {
    if (!enabled) return;

    const unlockSound = () => {
      const node = video.current;
      if (!node) return;

      if (!isElementVisible(node)) {
        node.pause();
        return;
      }

      pauseOtherVideos(node);
      node.muted = false;
      node
        .play()
        .then(() => {
          setBlocked(false);
          onMuteChange?.(false);
        })
        .catch(() => {});
    };

    const events = ["pointerdown", "touchstart", "click", "keydown"] as const;
    const handler = (e: Event) => {
      if (!e.isTrusted) return;
      unlockSound();
    };

    events.forEach((name) => window.addEventListener(name, handler, { capture: true, once: true }));
    return () => {
      events.forEach((name) => window.removeEventListener(name, handler, { capture: true }));
    };
  }, [enabled, onMuteChange, video]);

  return { blocked, play: attemptPlay };
}
