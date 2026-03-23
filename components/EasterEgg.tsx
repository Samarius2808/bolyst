"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Mode = 1 | 2 | 3 | 4 | 5;

const SAGE = "#55704a";
const COLORS = [SAGE, "#6b8f5e", "#8aad79", "#d97706", "#2563eb", "#dc2626", "#f59e0b", "#10b981"];
const a2h = (a: number) =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");

// ─── Mode 1: Fireworks ────────────────────────────────────────────────────────

function FireworksCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;

    const rockets = Array.from({ length: 7 }, (_, i) => ({
      x: cv.width * ((i + 1) / 8) + (Math.random() - 0.5) * 60,
      y: cv.height + 10,
      vy: -(10 + Math.random() * 5),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      exploded: false,
      particles: [] as { x: number; y: number; vx: number; vy: number; alpha: number }[],
      trail: [] as { x: number; y: number }[],
      delay: Math.floor(i * 18 + Math.random() * 20),
    }));

    let frame = 0;
    let raf: number;

    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const r of rockets) {
        if (frame < r.delay) continue;
        if (!r.exploded) {
          r.trail.push({ x: r.x, y: r.y });
          if (r.trail.length > 14) r.trail.shift();
          for (let i = 0; i < r.trail.length; i++) {
            ctx.beginPath();
            ctx.arc(r.trail[i].x, r.trail[i].y, 2, 0, Math.PI * 2);
            ctx.fillStyle = r.color + a2h((i / r.trail.length) * 0.8);
            ctx.fill();
          }
          r.y += r.vy;
          r.vy += 0.08;
          if (r.y < cv.height * 0.22 || r.vy > -2) {
            r.exploded = true;
            for (let i = 0; i < 24; i++) {
              const angle = (i / 24) * Math.PI * 2;
              const speed = 3 + Math.random() * 5;
              r.particles.push({
                x: r.x,
                y: r.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                alpha: 1,
              });
            }
          }
        } else {
          for (const p of r.particles) {
            if (p.alpha <= 0) continue;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.alpha -= 0.016;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = r.color + a2h(p.alpha);
            ctx.fill();
          }
        }
      }
      frame++;
      if (frame < 240) raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="fixed inset-0 z-[100] pointer-events-none" />;
}

// ─── Mode 2: Confetti cannon ──────────────────────────────────────────────────

function ConfettiCanvas({ ox, oy }: { ox: number; oy: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;

    const pieces = Array.from({ length: 110 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const speed = 10 + Math.random() * 14;
      return {
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 5 + Math.random() * 7,
        h: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.28,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
      };
    });

    let frame = 0;
    let raf: number;

    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of pieces) {
        if (p.alpha <= 0) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.rot += p.rotV;
        if (frame > 55) p.alpha -= 0.014;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color + a2h(p.alpha);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      frame++;
      if (frame < 165) raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ox, oy]);

  return <canvas ref={ref} className="fixed inset-0 z-[100] pointer-events-none" />;
}

// ─── Mode 3: Apartment icons ──────────────────────────────────────────────────

function ApartmentIcons() {
  const icons = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    x: Math.random() * 90 + 5,
    y: Math.random() * 85 + 5,
    size: 16 + Math.random() * 22,
    delay: Math.random() * 1.8,
    color: [SAGE, "#6b8f5e", "#8aad79"][Math.floor(Math.random() * 3)],
  }));

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <style>{`
        @keyframes iconPop {
          0%   { opacity: 0; transform: scale(0) rotate(-20deg); }
          25%  { opacity: 1; transform: scale(1.15) rotate(6deg); }
          55%  { opacity: 1; transform: scale(1) rotate(0deg); }
          100% { opacity: 0; transform: scale(0.8) translateY(-18px); }
        }
      `}</style>
      {icons.map((ic) => (
        <div
          key={ic.id}
          style={{
            position: "absolute",
            left: `${ic.x}%`,
            top: `${ic.y}%`,
            opacity: 0,
            animation: `iconPop 2.8s ease-in-out ${ic.delay}s forwards`,
          }}
        >
          <svg width={ic.size} height={ic.size} viewBox="0 0 24 24" fill={ic.color}>
            <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ─── Mode 4: SOLD stamp ───────────────────────────────────────────────────────

function SoldStamp() {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <style>{`
        @keyframes stampIn {
          0%   { opacity: 0; transform: rotate(-12deg) scale(2.5); }
          18%  { opacity: 1; transform: rotate(-12deg) scale(0.9); }
          28%  { transform: rotate(-12deg) scale(1.04); }
          38%  { transform: rotate(-12deg) scale(1); }
          72%  { opacity: 1; transform: rotate(-12deg) scale(1); }
          100% { opacity: 0; transform: rotate(-12deg) scale(0.96); }
        }
      `}</style>
      <div style={{ animation: "stampIn 3.4s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div
          className="px-14 py-5 border-[7px] border-sage-600 text-sage-600 select-none"
          style={{ fontFamily: "Georgia, serif", letterSpacing: "0.15em" }}
        >
          <div className="text-[84px] font-black leading-none">SOLD</div>
          <div className="text-xs text-center font-bold mt-1 tracking-widest">keep searching</div>
        </div>
      </div>
    </div>
  );
}

// ─── Mode 5: Bouncing houses (DVD screensaver) ────────────────────────────────

function BouncingHouses() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;

    const SIZE = 36;
    const houses = Array.from({ length: 5 }, () => ({
      x: Math.random() * (cv.width - SIZE),
      y: Math.random() * (cv.height - SIZE),
      vx: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 3),
      vy: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 3),
      color: COLORS[Math.floor(Math.random() * 4)],
    }));

    let frame = 0;
    let raf: number;
    const MAX = 240;

    function drawHouse(x: number, y: number, sz: number, color: string, alpha: number) {
      const s = sz / 24;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(3, 12);
      ctx.lineTo(12, 3);
      ctx.lineTo(21, 12);
      ctx.lineTo(21, 21);
      ctx.lineTo(15, 21);
      ctx.lineTo(15, 15);
      ctx.lineTo(9, 15);
      ctx.lineTo(9, 21);
      ctx.lineTo(3, 21);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const alpha = frame > MAX * 0.75 ? 1 - (frame - MAX * 0.75) / (MAX * 0.25) : 1;
      for (const h of houses) {
        h.x += h.vx;
        h.y += h.vy;
        if (h.x <= 0 || h.x >= cv.width - SIZE) h.vx *= -1;
        if (h.y <= 0 || h.y >= cv.height - SIZE) h.vy *= -1;
        drawHouse(h.x, h.y, SIZE, h.color, alpha);
      }
      frame++;
      if (frame < MAX) raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="fixed inset-0 z-[100] pointer-events-none" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EasterEgg() {
  const [mode, setMode] = useState<Mode | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const trigger = useCallback(() => {
    if (mode) return;
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    const m = (Math.floor(Math.random() * 5) + 1) as Mode;
    setMode(m);
    setTimeout(() => setMode(null), 5000);
  }, [mode]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={trigger}
        className="fixed bottom-5 right-5 z-40 px-3 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all select-none bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm"
      >
        don&apos;t press this
      </button>
      {mode === 1 && <FireworksCanvas />}
      {mode === 2 && <ConfettiCanvas ox={origin.x} oy={origin.y} />}
      {mode === 3 && <ApartmentIcons />}
      {mode === 4 && <SoldStamp />}
      {mode === 5 && <BouncingHouses />}
    </>
  );
}
