"use client";

import { useEffect, useRef } from "react";
import { PALETTE, makeNoise, propagate } from "@/components/fx/fire";

type Ember = { x: number; y: number; vx: number; vy: number; age: number; life: number; r: number; seed: number };
type Puff = { x: number; y: number; vx: number; vy: number; age: number; life: number; r: number };
type Ash = { x: number; y: number; vx: number; vy: number; age: number; life: number };
type Zone = { x: number; y: number; age: number; phase: [number, number, number] };

const MAX_EMBERS = 140;
const MAX_PUFFS = 40;
const MAX_ZONES = 5;
const PUSH_RADIUS = 110;
const ZONE_RADIUS = 120;
const ZONE_LIFE = 8;
const FIRE_DECAY = 3.8; // flame height: higher is shorter
const FIRE_ALPHA = 0.8;
const CHAR = [42, 22, 14];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const INTERACTIVE = "a, button, input, textarea, select, label, [role='button'], .burn-intro";

// Full-viewport fire layer behind the page: a fire burning along the bottom of
// the screen with embers rising off it. The pointer pushes embers aside and
// leaves drifting gas. A click puts the fire out in a scorched patch, and a
// ragged fire front eats back into it from every side over ZONE_LIFE seconds.
// Pauses when the tab is hidden and never starts under reduced motion.
export function EmberField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const fireRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const fireCanvas = fireRef.current;
    const ctx = canvas?.getContext("2d");
    const fireCtx = fireCanvas?.getContext("2d");
    if (!canvas || !ctx || !fireCanvas || !fireCtx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const map = document.createElement("canvas");
    const mapCtx = map.getContext("2d");
    if (!mapCtx) return;

    let w = 0;
    let h = 0;
    let cell = 5;
    let cols = 0;
    let rows = 0;
    let heat = new Uint8Array(0);
    let scorch = new Uint8Array(0);
    let image = mapCtx.createImageData(1, 1);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fireCanvas.width = w;
      fireCanvas.height = h;

      cell =Math.max(5, Math.ceil(w / 320));
      cols = Math.ceil(w / cell);
      rows = Math.ceil(h / cell);
      map.width = cols;
      map.height = rows;
      heat = new Uint8Array(cols * rows);
      scorch = new Uint8Array(cols * rows);
      image = mapCtx.createImageData(cols, rows);
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = { ember: "#e8825a", gas: "#9b968b" };
    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      colors.ember = s.getPropertyValue("--accent").trim() || colors.ember;
      colors.gas = s.getPropertyValue("--muted").trim() || colors.gas;
    };
    readColors();
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const noise = makeNoise();
    const embers: Ember[] = [];
    const puffs: Puff[] = [];
    const ashes: Ash[] = [];
    const zones: Zone[] = [];
    const pointer = { x: 0, y: 0, active: false, lastSpawn: 0 };

    // The fire front's distance from the zone centre at angle `a`. It closes in
    // slowly at first, then faster, with a ragged, wobbling outline.
    const zoneEdge = (z: Zone, a: number, t: number) => {
      const p = (z.age / ZONE_LIFE) ** 1.3;
      const jag =
        0.5 * Math.sin(3 * a + z.phase[0]) +
        0.3 * Math.sin(5 * a + z.phase[1]) +
        0.2 * Math.sin(9 * a + z.phase[2]) +
        0.15 * Math.sin(t * 2 + a * 4);
      return ZONE_RADIUS * (1 - p) * (1 + 0.2 * jag);
    };
    const inZone = (x: number, y: number, t: number) =>
      zones.some((z) => {
        const dx = x - z.x;
        const dy = y - z.y;
        return Math.hypot(dx, dy) < zoneEdge(z, Math.atan2(dy, dx), t);
      });

    const spawnEmber = (x: number, y: number, burst = false) => {
      if (embers.length >= MAX_EMBERS) return;
      embers.push({
        x,
        y,
        vx: burst ? rand(-40, 40) : rand(-6, 6),
        vy: burst ? rand(-110, -40) : rand(-85, -30),
        age: 0,
        life: burst ? rand(1.5, 3) : rand(4, 9),
        r: rand(0.8, 2.2),
        seed: Math.random() * 100,
      });
    };

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - pointer.x;
      const dy = e.clientY - pointer.y;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;

      const now = performance.now();
      if (now - pointer.lastSpawn > 50 && puffs.length < MAX_PUFFS) {
        pointer.lastSpawn = now;
        puffs.push({ x: pointer.x, y: pointer.y, vx: dx * 0.6, vy: rand(-22, -10) + dy * 0.3, age: 0, life: rand(1.6, 2.4), r: rand(6, 10) });
        if (Math.random() < 0.3) spawnEmber(pointer.x, pointer.y, true);
      }
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
      if (zones.length >= MAX_ZONES) zones.shift();
      zones.push({ x: e.clientX, y: e.clientY, age: 0, phase: [rand(0, 6.3), rand(0, 6.3), rand(0, 6.3)] });
      for (let i = 0; i < 10; i++) {
        puffs.push({ x: e.clientX + rand(-30, 30), y: e.clientY + rand(-30, 30), vx: rand(-30, 30), vy: rand(-30, -8), age: 0, life: rand(1.4, 2.4), r: rand(10, 20) });
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });

    // Writes this frame's heat sources: the fire along the bottom edge, and the
    // front of every extinguished zone. Cells inside a zone are put out.
    const feedFire = (t: number, dt: number) => {
      const base = (rows - 1) * cols;
      for (let x = 0; x < cols; x++) {
        heat[base + x] = 20 + ((noise(x * 0.12, t * 1.5) * 12 + Math.random() * 3) | 0);
      }

      scorch.fill(0);
      for (let i = zones.length - 1; i >= 0; i--) {
        const z = zones[i];
        z.age += dt;
        if (z.age >= ZONE_LIFE) {
          zones.splice(i, 1);
          for (let j = 0; j < 16; j++) spawnEmber(z.x, z.y, true);
          continue;
        }

        const ramp = Math.min(z.age / 1.2, 1); // the surrounding fire takes a moment to arrive
        const charA = Math.min(z.age / 0.3, 1);
        const band = cell * 2.2;
        const r = Math.ceil(ZONE_RADIUS * 1.25 / cell);
        const cx = Math.floor(z.x / cell);
        const cy = Math.floor(z.y / cell);
        for (let y = Math.max(cy - r, 0); y < Math.min(cy + r, rows); y++) {
          for (let x = Math.max(cx - r, 0); x < Math.min(cx + r, cols); x++) {
            const dx = x * cell + cell / 2 - z.x;
            const dy = y * cell + cell / 2 - z.y;
            const d = Math.hypot(dx, dy);
            const edge = zoneEdge(z, Math.atan2(dy, dx), t);
            if (d >= edge) continue;
            const i = y * cols + x;
            if (d > edge - band) {
              heat[i] = (ramp * (22 + Math.random() * 12)) | 0;
              if (Math.random() < 0.002) spawnEmber(x * cell, y * cell, true);
            } else {
              heat[i] = 0;
              scorch[i] = Math.max(scorch[i], charA * 90);
            }
          }
        }
      }
    };

    const drawFire = () => {
      const data = image.data;
      for (let i = 0; i < heat.length; i++) {
        const o = i * 4;
        const v = heat[i];
        if (v > 0) {
          const p = v * 4;
          data[o] = PALETTE[p];
          data[o + 1] = PALETTE[p + 1];
          data[o + 2] = PALETTE[p + 2];
          data[o + 3] = PALETTE[p + 3];
        } else if (scorch[i] > 0) {
          data[o] = CHAR[0];
          data[o + 1] = CHAR[1];
          data[o + 2] = CHAR[2];
          data[o + 3] = scorch[i];
        } else {
          data[o + 3] = 0;
        }
      }
      mapCtx.putImageData(image, 0, 0);
      fireCtx.clearRect(0, 0, w, h);
      fireCtx.globalAlpha = FIRE_ALPHA;
      fireCtx.imageSmoothingEnabled = true;
      fireCtx.drawImage(map, 0, 0, w, h);
    };

    let raf = 0;
    let last = performance.now();
    let spawnDebt = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, w, h);

      propagate(heat, cols, rows, FIRE_DECAY);
      feedFire(t, dt);
      drawFire();

      // Sparks thrown up off the bottom fire; rate scales with width.
      spawnDebt += dt * 18 * Math.min(w / 1200, 1);
      while (spawnDebt >= 1) {
        spawnDebt -= 1;
        const x = rand(0, w);
        const y = h - rand(20, 90);
        if (!inZone(x, y, t)) spawnEmber(x, y);
      }

      // Gas
      ctx.fillStyle = colors.gas;
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.age += dt;
        if (p.age >= p.life) {
          puffs.splice(i, 1);
          continue;
        }
        const k = p.age / p.life;
        p.vx *= 0.96;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = 0.12 * (1 - k);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + k * 34, 0, Math.PI * 2);
        ctx.fill();
      }

      // Embers
      ctx.fillStyle = colors.ember;
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.age += dt;
        if (e.age >= e.life || e.y < -10) {
          embers.splice(i, 1);
          continue;
        }
        if (inZone(e.x, e.y, t)) {
          embers.splice(i, 1);
          ashes.push({ x: e.x, y: e.y, vx: e.vx * 0.2, vy: rand(10, 30), age: 0, life: rand(0.9, 1.6) });
          continue;
        }

        if (pointer.active) {
          const dx = e.x - pointer.x;
          const dy = e.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < PUSH_RADIUS * PUSH_RADIUS && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = (1 - d / PUSH_RADIUS) * 260;
            e.vx += (dx / d) * f * dt;
            e.vy += (dy / d) * f * dt;
          }
        }

        e.vx = e.vx * 0.97 + Math.sin(t * 1.7 + e.seed) * 40 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        const k = e.age / e.life;
        const flicker = 0.65 + 0.35 * Math.sin(t * 14 + e.seed * 3);
        const alpha = Math.sin(Math.PI * k) * flicker;

        ctx.globalAlpha = alpha * 0.18;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ash from put-out embers
      ctx.fillStyle = colors.gas;
      for (let i = ashes.length - 1; i >= 0; i--) {
        const a = ashes[i];
        a.age += dt;
        if (a.age >= a.life) {
          ashes.splice(i, 1);
          continue;
        }
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        ctx.globalAlpha = 0.6 * (1 - a.age / a.life);
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };

    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      mo.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Fire and particles on separate canvases so only the fire gets the softening blur.
  return (
    <>
      <canvas ref={fireRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full [filter:blur(2px)]" />
      <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
    </>
  );
}
