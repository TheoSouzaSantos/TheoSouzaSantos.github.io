"use client";

import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Cpu, Flame, Volume2, Wifi, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

// Mirrors the firmware: MQ-2 on a 12-bit ADC (0–4095) with LIMITE_GAS as the alarm threshold.
// The real board reports every 30 s; the demo ticks faster so something happens.
const ADC_MAX = 4095;
const GAS_LIMIT = 1800;
const GAS_CLEAR = GAS_LIMIT - 150;
const GAS_IDLE = 620;
const POINTS = 40;
const TICK_MS = 700;
const NOTICE_MS = 6000;

type Kind = "flame" | "gas";
type Notice = { id: number; kind: Kind; at: number; value: number };
type LogEntry = { id: number; text: string; at: number; alert: boolean };

type State = {
  history: number[];
  flame: boolean;
  leaking: boolean;
  gasAlarm: boolean;
  notices: Notice[];
  log: LogEntry[];
  seq: number;
  nextId: number;
};

type Action =
  | { type: "tick"; noise: number; at: number }
  | { type: "flame"; at: number }
  | { type: "leak" }
  | { type: "dismiss"; id: number };

const initialState: State = {
  history: Array.from({ length: POINTS }, (_, i) => GAS_IDLE + Math.round(Math.sin(i * 0.9) * 30)),
  flame: false,
  leaking: false,
  gasAlarm: false,
  notices: [],
  log: [],
  seq: 0,
  nextId: 1,
};

function pushEvent(state: State, at: number, text: string, notice?: { kind: Kind; value: number }): State {
  const id = state.nextId;
  return {
    ...state,
    nextId: id + 1,
    log: [{ id, text, at, alert: !!notice }, ...state.log].slice(0, 4),
    notices: notice ? [{ id, at, ...notice }, ...state.notices].slice(0, 3) : state.notices,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "tick": {
      const prev = state.history[state.history.length - 1];
      const value = state.leaking
        ? Math.min(prev + 140 + action.noise * 110, 3700)
        : Math.max(prev + (GAS_IDLE - prev) * 0.3 + (action.noise - 0.5) * 60, 0);
      let next: State = { ...state, history: [...state.history.slice(1), value], seq: state.seq + 1 };
      if (!state.gasAlarm && value > GAS_LIMIT) {
        next = pushEvent({ ...next, gasAlarm: true }, action.at, "Vazamento de gás detectado", { kind: "gas", value: Math.round(value) });
      } else if (state.gasAlarm && value < GAS_CLEAR) {
        next = pushEvent({ ...next, gasAlarm: false }, action.at, "Gás normalizado");
      }
      return next;
    }
    case "flame":
      return state.flame
        ? pushEvent({ ...state, flame: false }, action.at, "Chama apagada")
        : pushEvent({ ...state, flame: true }, action.at, "Chama detectada", { kind: "flame", value: 1 });
    case "leak":
      return { ...state, leaking: !state.leaking };
    case "dismiss":
      return { ...state, notices: state.notices.filter((n) => n.id !== action.id) };
  }
}

const formatTime = (at: number) => new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Phone status-bar clock; empty on the server so hydration matches.
const subscribeClock = (cb: () => void) => {
  const id = setInterval(cb, 15_000);
  return () => clearInterval(id);
};
const useClock = () => useSyncExternalStore(subscribeClock, () => formatTime(Date.now()), () => "");

const noticeCopy = (n: Notice) =>
  n.kind === "flame"
    ? { title: "Chama detectada", body: "O sensor da cozinha detectou fogo. Verifique o local." }
    : { title: "Vazamento de gás", body: `MQ-2 em ${n.value}, acima do limite de ${GAS_LIMIT}. Abra as janelas.` };

function Sparkline({ values, alert }: { values: number[]; alert: boolean }) {
  const y = (v: number) => 30 - (v / ADC_MAX) * 28;
  const points = values.map((v, i) => `${((i / (POINTS - 1)) * 200).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg viewBox="0 0 200 32" preserveAspectRatio="none" className="mt-2 h-8 w-full" aria-hidden="true">
      <line x1="0" x2="200" y1={y(GAS_LIMIT)} y2={y(GAS_LIMIT)} className="stroke-border" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <polyline
        points={points}
        fill="none"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className={cn("transition-[stroke] duration-200", alert ? "stroke-accent" : "stroke-foreground")}
      />
    </svg>
  );
}

function Led({ on, color, label }: { on: boolean; color: "ok" | "alarm"; label: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted">
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        {on && color === "alarm" && <span className="buzz absolute inset-0 rounded-full bg-accent" />}
        <span
          className={cn(
            "relative h-2.5 w-2.5 rounded-full transition-colors duration-150",
            !on ? "bg-border" : color === "ok" ? "bg-ok" : "bg-accent",
          )}
        />
      </span>
      {label}
    </span>
  );
}

function Toggle({
  pressed,
  onClick,
  icon: Icon,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  icon: typeof Flame;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out-strong active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        pressed ? "border-accent bg-accent text-white" : "border-border text-foreground hover:border-foreground",
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {children}
    </button>
  );
}

export function SensorDemo() {
  const reduce = useReducedMotion();
  const clock = useClock();
  const [state, dispatch] = useReducer(reducer, initialState);
  const rootRef = useRef<HTMLDivElement>(null);

  // Only poll the "sensors" while the demo is on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([entry]) => {
      clearInterval(timer);
      if (!entry.isIntersecting) return;
      timer = setInterval(() => dispatch({ type: "tick", noise: Math.random(), at: Date.now() }), TICK_MS);
    });
    io.observe(el);
    return () => {
      clearInterval(timer);
      io.disconnect();
    };
  }, []);

  // Push notifications clear themselves, like on a phone.
  useEffect(() => {
    const timers = state.notices.map((n) =>
      setTimeout(() => dispatch({ type: "dismiss", id: n.id }), Math.max(0, n.at + NOTICE_MS - Date.now())),
    );
    return () => timers.forEach(clearTimeout);
  }, [state.notices]);

  const gas = Math.round(state.history[state.history.length - 1]);
  const alarm = state.flame || state.gasAlarm;
  const latest = state.notices[0];

  return (
    <div ref={rootRef} className="grid gap-6 lg:grid-cols-[1fr_auto_260px] lg:items-center">
      {/* Board */}
      <div className="rounded-md border border-border p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Cpu aria-hidden="true" className="h-4 w-4 text-muted" /> Placa ESP32
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Wifi aria-hidden="true" className="h-3.5 w-3.5" /> online
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <Led on={!alarm} color="ok" label="LED verde" />
          <Led on={alarm} color="alarm" label="LED vermelho" />
          <span className={cn("flex items-center gap-2 text-sm transition-colors duration-150", alarm ? "text-accent" : "text-muted")}>
            <Volume2 aria-hidden="true" className="h-4 w-4" />
            {alarm ? "Buzzer tocando" : "Buzzer"}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-surface p-3">
            <dt className="text-xs text-muted">Chama (D0)</dt>
            <dd className={cn("mt-1 font-display text-xl transition-colors duration-150", state.flame && "text-accent")}>
              {state.flame ? "Detectada" : "Normal"}
            </dd>
          </div>
          <div className="rounded-md bg-surface p-3">
            <dt className="text-xs text-muted">Gás (A0)</dt>
            <dd className={cn("mt-1 font-display text-xl tabular-nums transition-colors duration-150", state.gasAlarm && "text-accent")}>
              {gas}
            </dd>
            <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
              <div
                className={cn(
                  "absolute inset-0 origin-left rounded-full transition-[transform,background-color] duration-300 ease-out-strong",
                  state.gasAlarm ? "bg-accent" : "bg-foreground",
                )}
                style={{ transform: `scaleX(${gas / ADC_MAX})` }}
              />
              <div className="absolute inset-y-0 w-px bg-background" style={{ left: `${(GAS_LIMIT / ADC_MAX) * 100}%` }} />
            </div>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <Toggle pressed={state.flame} onClick={() => dispatch({ type: "flame", at: Date.now() })} icon={Flame}>
            Simular chama
          </Toggle>
          <Toggle pressed={state.leaking} onClick={() => dispatch({ type: "leak" })} icon={Wind}>
            Simular vazamento de gás
          </Toggle>
        </div>
      </div>

      {/* Link: each reading travels board → API → phone */}
      <div className="hidden w-20 flex-col items-center gap-2 lg:flex" aria-hidden="true">
        <span className="text-xs text-muted">HTTPS</span>
        <div className="relative h-px w-full bg-border">
          <span key={state.seq} className="packet absolute inset-0">
            <span
              className={cn(
                "absolute -top-[3px] left-0 h-[7px] w-[7px] -translate-x-1/2 rounded-full",
                alarm ? "bg-accent" : "bg-muted",
              )}
            />
          </span>
        </div>
        <span className="text-xs text-muted">API</span>
      </div>

      {/* Phone */}
      <div className="relative mx-auto h-[460px] w-full max-w-[260px] overflow-hidden rounded-[2rem] border border-border bg-background p-3 shadow-[0_20px_40px_-24px_rgb(0_0_0/0.4)]">
        <div className="flex items-center justify-between px-3 pt-1 text-[11px] font-medium tabular-nums">
          <span>{clock}</span>
          <span className="h-4 w-16 rounded-full bg-foreground" aria-hidden="true" />
          <Wifi aria-hidden="true" className="h-3 w-3" />
        </div>

        <div className="mt-5 px-2">
          <p className="text-xs text-muted">Dynamic Flame Sensor</p>
          <p className="font-display text-xl">Minha casa</p>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2.5">
            <div>
              <p className="text-xs text-muted">Cozinha · chama</p>
              <p className={cn("text-sm font-medium transition-colors duration-150", state.flame && "text-accent")}>
                {state.flame ? "Fogo detectado" : "Tudo certo"}
              </p>
            </div>
            <Flame aria-hidden="true" className={cn("h-4 w-4 transition-colors duration-150", state.flame ? "text-accent" : "text-muted")} />
          </div>
          <div className="rounded-xl bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Cozinha · gás</p>
              <p className={cn("text-sm font-medium tabular-nums transition-colors duration-150", state.gasAlarm && "text-accent")}>
                {gas}
              </p>
            </div>
            <Sparkline values={state.history} alert={state.gasAlarm} />
          </div>
        </div>

        <div className="mt-4 px-2">
          <p className="text-xs font-medium text-muted">Histórico</p>
          {state.log.length === 0 ? (
            <p className="mt-2 text-xs text-muted">Nenhum alerta ainda.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {state.log.map((entry) => (
                <li key={entry.id} className="flex gap-2 text-xs">
                  <span className="tabular-nums text-muted">{formatTime(entry.at)}</span>
                  <span className={cn(entry.alert && "text-accent")}>{entry.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Push notifications */}
        <div className="absolute inset-x-2 top-8 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {state.notices.map((n) => {
              const copy = noticeCopy(n);
              const Icon = n.kind === "flame" ? Flame : Wind;
              return (
                <motion.button
                  key={n.id}
                  type="button"
                  layout={!reduce}
                  aria-label={`Dispensar notificação: ${copy.title}`}
                  onClick={() => dispatch({ type: "dismiss", id: n.id })}
                  initial={{ opacity: 0, transform: reduce ? "none" : "translateY(-24px) scale(0.96)" }}
                  animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                  exit={{ opacity: 0, transform: reduce ? "none" : "translateY(-24px) scale(0.96)" }}
                  transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
                  className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-surface p-2.5 text-left shadow-[0_10px_24px_-14px_rgb(0_0_0/0.5)] focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex justify-between gap-2 text-[11px] text-muted">
                      DFS <span>agora</span>
                    </span>
                    <span className="block text-sm font-medium leading-5">{copy.title}</span>
                    <span className="block text-xs leading-4 text-muted">{copy.body}</span>
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {latest ? `${noticeCopy(latest).title}. ${noticeCopy(latest).body}` : ""}
      </p>
    </div>
  );
}
