"use client";

import { useEffect, useRef } from "react";
import { PALETTE, makeNoise, propagate } from "@/components/fx/fire";

const DURATION = 2200; // ms for the burn front to travel top to bottom
const EDGE = 0.06; // charred band behind the front, in progress units
const PREHEAT = 0.05; // scorch tint ahead of the front
const HOLD = 0.12; // progress the bottom keeps burning before the cover fades
const SEE_THROUGH = 0.7; // how much the unburned cover thins by the end
const DECAY = 4; // flame height: higher is shorter
const FADE_MS = 500;

const parseRgb = (value: string) => (value.match(/\d+(\.\d+)?/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);

const CHAR = [42, 22, 14];
const SCORCH = [176, 82, 30];

// Opening sequence: the page starts under a cover that burns away from the top
// down. Real flames ride the burn front, the page shows through the thinning
// cover as it goes, and the fire settles at the bottom of the screen, where the
// page-wide EmberField keeps burning. Any click or key speeds it up.
// Server-rendered so it covers the first paint; a CSS fallback hides it if JS
// never runs, and it doesn't render at all under reduced motion.
export function BurnIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;

    const hide = () => {
      root.style.display = "none";
    };
    // Reduced motion, or hydration came so late that the CSS fallback already hid it.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || performance.now() > 3500) {
      hide();
      return;
    }
    root.style.animation = "none";

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const cell = Math.max(4, Math.ceil(w / 360));
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);
    const map = document.createElement("canvas");
    map.width = cols;
    map.height = rows;
    const mapCtx = map.getContext("2d");
    if (!mapCtx) return hide();
    const image = mapCtx.createImageData(cols, rows);

    // Burn time per cell: the top burns first, noise makes the front ragged.
    const noise = makeNoise();
    const burnAt = new Float32Array(cols * rows);
    let min = Infinity;
    let max = -Infinity;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = (y / rows) * 0.8 + noise(x * 0.05, y * 0.05) * 0.3 + noise(x * 0.2, y * 0.2) * 0.08;
        burnAt[y * cols + x] = v;
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
    for (let i = 0; i < burnAt.length; i++) burnAt[i] = (burnAt[i] - min) / (max - min);

    const heat = new Uint8Array(cols * rows);
    const bg = parseRgb(getComputedStyle(root).backgroundColor);

    let progress = 0;
    let speed = 1;
    let fading = false;
    let last = performance.now();
    let raf = 0;

    const skip = () => {
      speed = 5;
    };
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);

    const cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };

    const frame = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      progress += (dt / DURATION) * speed;

      // Fire: cells on the front are heat sources; once the front has passed
      // the bottom, the bottom row keeps burning.
      propagate(heat, cols, rows, DECAY);
      for (let i = 0; i < burnAt.length; i++) {
        const d = progress - burnAt[i];
        if (d >= 0 && d < EDGE * 0.35) heat[i] = 28 + ((Math.random() * 9) | 0);
      }
      if (progress > 1) {
        const base = (rows - 1) * cols;
        for (let x = 0; x < cols; x++) heat[base + x] = 28 + ((Math.random() * 9) | 0);
      }

      const coverAlpha = 1 - SEE_THROUGH * Math.min(progress, 1);
      const data = image.data;
      for (let i = 0; i < burnAt.length; i++) {
        const d = progress - burnAt[i];
        let r: number;
        let g: number;
        let b: number;
        let a: number;
        if (d > EDGE) {
          r = g = b = a = 0;
        } else if (d >= 0) {
          const k = d / EDGE;
          [r, g, b] = CHAR;
          a = 1 - k;
        } else {
          const k = -d < PREHEAT ? (1 + d / PREHEAT) * 0.55 : 0;
          r = bg[0] + (SCORCH[0] - bg[0]) * k;
          g = bg[1] + (SCORCH[1] - bg[1]) * k;
          b = bg[2] + (SCORCH[2] - bg[2]) * k;
          a = coverAlpha + (1 - coverAlpha) * k;
        }

        const p = heat[i] * 4;
        const fa = PALETTE[p + 3] / 255;
        const o = i * 4;
        const outA = fa + a * (1 - fa);
        if (outA <= 0) {
          data[o + 3] = 0;
          continue;
        }
        data[o] = (PALETTE[p] * fa + r * a * (1 - fa)) / outA;
        data[o + 1] = (PALETTE[p + 1] * fa + g * a * (1 - fa)) / outA;
        data[o + 2] = (PALETTE[p + 2] * fa + b * a * (1 - fa)) / outA;
        data[o + 3] = outA * 255;
      }
      mapCtx.putImageData(image, 0, 0);

      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(map, 0, 0, w, h);
      // The canvas now paints the cover, so drop the server-rendered solid fill
      // and let the burned areas show the page.
      root.style.background = "transparent";

      if (!fading && progress >= 1 + EDGE + HOLD) {
        fading = true;
        root.style.pointerEvents = "none";
        root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: "ease-out", fill: "forwards" }).onfinish = () => {
          cleanup();
          hide();
        };
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return cleanup;
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="burn-intro fixed inset-0 z-[100] bg-background">
      {/* A slight blur turns the low-res fire grid into soft flames. */}
      <canvas ref={canvasRef} className="h-full w-full [filter:blur(2.5px)]" />
    </div>
  );
}
