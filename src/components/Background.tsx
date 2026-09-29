import { useEffect, useRef } from "react";

const EMOJI = ["☕", "🍺", "🥐", "💅", "🏋️", "🎮", "📚", "🐶", "🍗", "🛒", "🏪", "🧳", "🌸", "🥩", "🍝", "🏥", "🎤", "🧺"];

interface Particle {
  x: number;
  y: number;
  vy: number;
  sway: number;
  phase: number;
  size: number;
  emoji: string;
  alpha: number;
}

/** Soft gradient blobs + slowly rising "store" emoji. */
export default function Background() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let particles: Particle[] = [];
    let mouseX = 0.5;
    let mouseY = 0.5;

    const spawn = (initial: boolean): Particle => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 40,
      vy: 0.12 + Math.random() * 0.35,
      sway: 8 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      size: 14 + Math.random() * 22,
      emoji: EMOJI[Math.floor(Math.random() * EMOJI.length)],
      alpha: 0.08 + Math.random() * 0.16,
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(46, (w * h) / 26000));
      particles = Array.from({ length: target }, () => spawn(true));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const px = (mouseX - 0.5) * 24;
      const py = (mouseY - 0.5) * 16;
      for (const p of particles) {
        if (!reduce) {
          p.y -= p.vy;
          if (p.y < -40) Object.assign(p, spawn(false));
        }
        const depth = p.size / 36;
        const x = p.x + Math.sin(t / 2400 + p.phase) * p.sway + px * depth;
        const y = p.y + py * depth;
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.fillText(p.emoji, x, y);
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX / Math.max(1, w);
      mouseY = e.clientY / Math.max(1, h);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="bg-layer" aria-hidden="true">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <canvas ref={ref} className="bg-canvas" />
      <div className="grain" />
    </div>
  );
}
