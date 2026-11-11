import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MouseEvent } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sticky header height (~69px) plus breathing room. Anchor scrolling is
// handled manually because scroll-margin/scroll-padding is not consistently
// honored by next/link's client-side hash navigation.
export const HEADER_OFFSET = 88;

export function scrollToHash(
  event: MouseEvent<HTMLAnchorElement>,
  hash: string,
  reduceMotion: boolean | null,
) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;

  event.preventDefault();
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
  history.pushState(null, "", hash);
}
