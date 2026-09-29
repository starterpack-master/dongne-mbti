import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DONGS, Dong, fmt } from "../lib/data";
import { TYPES, TYPE_ORDER, profileOf } from "../lib/types";

interface Props {
  dong: Dong;
  onPick: (d: Dong) => void;
}

type Filter = "all" | string;

const LON0 = 127.6;
const LAT0 = 36.0;
const KX = Math.cos((LAT0 * Math.PI) / 180);

// world coordinates (roughly equirectangular, y grows downward)
const WX = DONGS.map((d) => (d.lon - LON0) * KX);
const WY = DONGS.map((d) => -(d.lat - LAT0));
const RADIUS = DONGS.map((d) => Math.max(1.1, Math.min(4.2, 0.4 + Math.log10(d.total + 1) * 0.95)));
const COLOR = DONGS.map((d) => profileOf(d.type).colors[0]);
const BOUNDS = {
  minX: Math.min(...WX),
  maxX: Math.max(...WX),
  minY: Math.min(...WY),
  maxY: Math.max(...WY),
};

interface View {
  cx: number; // world center
  cy: number;
  zoom: number;
}

export default function Galaxy({ dong, onPick }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overRef = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 0, h: 0, dpr: 1, base: 1 });
  const view = useRef<View>({ cx: (BOUNDS.minX + BOUNDS.maxX) / 2, cy: (BOUNDS.minY + BOUNDS.maxY) / 2, zoom: 1 });
  const hoverIdx = useRef(-1);
  const [filter, setFilter] = useState<Filter>("all");
  const [tip, setTip] = useState<{ i: number; x: number; y: number; pinned: boolean } | null>(null);
  const currentIdx = useMemo(() => DONGS.findIndex((d) => d.code === dong.code), [dong.code]);

  const matches = useCallback(
    (i: number) => filter === "all" || DONGS[i].type === (filter === "same" ? dong.type : filter),
    [filter, dong.type],
  );

  const shownCount = useMemo(() => DONGS.reduce((n, _, i) => n + (matches(i) ? 1 : 0), 0), [matches]);

  const toScreen = (i: number) => {
    const { w, h, base } = size.current;
    const v = view.current;
    const s = base * v.zoom;
    return { x: w / 2 + (WX[i] - v.cx) * s, y: h / 2 + (WY[i] - v.cy) * s };
  };

  const drawBase = useCallback(() => {
    const c = baseRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const { w, h, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const zoomBoost = Math.min(2.6, 0.75 + view.current.zoom * 0.22);
    // dim layer first, then highlighted dots on top with additive glow
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < DONGS.length; i++) {
      if (matches(i)) continue;
      const p = toScreen(i);
      if (p.x < -10 || p.y < -10 || p.x > w + 10 || p.y > h + 10) continue;
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, RADIUS[i] * 0.7 * zoomBoost, 0, Math.PI * 2);
      ctx.fill();
    }
    // soft additive glow (low alpha so dense cities don't blow out to white)
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = filter === "all" ? 0.07 : 0.16;
    for (let i = 0; i < DONGS.length; i++) {
      if (!matches(i)) continue;
      const p = toScreen(i);
      if (p.x < -10 || p.y < -10 || p.x > w + 10 || p.y > h + 10) continue;
      ctx.fillStyle = COLOR[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, RADIUS[i] * zoomBoost * 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // crisp colored cores keep their real color
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.92;
    for (let i = 0; i < DONGS.length; i++) {
      if (!matches(i)) continue;
      const p = toScreen(i);
      if (p.x < -10 || p.y < -10 || p.x > w + 10 || p.y > h + 10) continue;
      ctx.fillStyle = COLOR[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, RADIUS[i] * zoomBoost, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, filter]);

  // overlay: pulsing ring on the current dong + hover ring
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const c = overRef.current;
      if (c) {
        const ctx = c.getContext("2d")!;
        const { w, h, dpr } = size.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (currentIdx >= 0) {
          const p = toScreen(currentIdx);
          const phase = (t % 1600) / 1600;
          ctx.strokeStyle = `rgba(255,255,255,${1 - phase})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 + phase * 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = `800 13px "Pretendard Variable", sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fillText(`📍 ${DONGS[currentIdx].name}`, p.x + 10, p.y - 10);
        }
        const hi = hoverIdx.current;
        if (hi >= 0) {
          const p = toScreen(hi);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // sizing
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const resize = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const base = Math.min(r.width / (BOUNDS.maxX - BOUNDS.minX), r.height / (BOUNDS.maxY - BOUNDS.minY)) * 0.9;
      size.current = { w: r.width, h: r.height, dpr, base };
      for (const c of [baseRef.current, overRef.current]) {
        if (!c) continue;
        c.width = Math.floor(r.width * dpr);
        c.height = Math.floor(r.height * dpr);
      }
      drawBase();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    return () => ro.disconnect();
  }, [drawBase]);

  useEffect(() => {
    drawBase();
  }, [drawBase]);

  const nearest = (x: number, y: number, maxDist: number) => {
    let best = -1;
    let bestD = maxDist * maxDist;
    for (let i = 0; i < DONGS.length; i++) {
      if (!matches(i)) continue;
      const p = toScreen(i);
      const dx = p.x - x;
      const dy = p.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) {
        bestD = d2;
        best = i;
      }
    }
    return best;
  };

  const zoomAt = (factor: number, sx: number, sy: number) => {
    const { w, h, base } = size.current;
    const v = view.current;
    const s = base * v.zoom;
    const wx = v.cx + (sx - w / 2) / s;
    const wy = v.cy + (sy - h / 2) / s;
    const nz = Math.max(0.8, Math.min(60, v.zoom * factor));
    const ns = base * nz;
    v.zoom = nz;
    v.cx = wx - (sx - w / 2) / ns;
    v.cy = wy - (sy - h / 2) / ns;
    drawBase();
    setTip(null);
  };

  const flyTo = (i: number, zoom: number) => {
    const v = view.current;
    const from = { ...v };
    const to = { cx: WX[i], cy: WY[i], zoom };
    const start = performance.now();
    const dur = 900;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      v.cx = from.cx + (to.cx - from.cx) * e;
      v.cy = from.cy + (to.cy - from.cy) * e;
      v.zoom = from.zoom * Math.pow(to.zoom / from.zoom, e);
      drawBase();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTip(null);
  };

  // pointer interactions: drag to pan, pinch to zoom, tap to inspect, wheel to zoom
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinchDist = 0;

    const local = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest(".galaxy-ui, .galaxy-tip")) return;
      box.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      moved = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      if (!pointers.has(e.pointerId)) {
        if (e.pointerType === "mouse") {
          const i = nearest(p.x, p.y, 14);
          hoverIdx.current = i;
          box.style.cursor = i >= 0 ? "pointer" : "grab";
          setTip((prev) => {
            if (prev?.pinned) return prev;
            if (i < 0) return null;
            const s = toScreen(i);
            return { i, x: s.x, y: s.y, pinned: false };
          });
        }
        return;
      }
      const prev = pointers.get(e.pointerId)!;
      pointers.set(e.pointerId, p);
      if (pointers.size === 1) {
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 4) {
          const v = view.current;
          const s = size.current.base * v.zoom;
          v.cx -= dx / s;
          v.cy -= dy / s;
          drawBase();
          setTip(null);
        }
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) zoomAt(dist / pinchDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinchDist = dist;
        moved += 10;
      }
    };
    const onUp = (e: PointerEvent) => {
      const p = local(e);
      const wasTap = pointers.size === 1 && moved <= 4;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (wasTap) {
        const i = nearest(p.x, p.y, 22);
        hoverIdx.current = i;
        if (i >= 0) {
          const s = toScreen(i);
          setTip({ i, x: s.x, y: s.y, pinned: true });
        } else setTip(null);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = box.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0018), e.clientX - r.left, e.clientY - r.top);
    };
    const onLeave = () => {
      hoverIdx.current = -1;
      setTip((prev) => (prev?.pinned ? prev : null));
    };
    box.addEventListener("pointerdown", onDown);
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerup", onUp);
    box.addEventListener("pointercancel", onUp);
    box.addEventListener("pointerleave", onLeave);
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      box.removeEventListener("pointerdown", onDown);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerup", onUp);
      box.removeEventListener("pointercancel", onUp);
      box.removeEventListener("pointerleave", onLeave);
      box.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawBase, matches]);

  const tipDong = tip ? DONGS[tip.i] : null;
  const tipProfile = tipDong ? profileOf(tipDong.type) : null;

  return (
    <div>
      <div className="galaxy-box" ref={boxRef}>
        <canvas ref={baseRef} />
        <canvas ref={overRef} />
        <div className="galaxy-ui">
          <button className="btn" aria-label="확대" onClick={() => zoomAt(1.6, size.current.w / 2, size.current.h / 2)}>
            ＋
          </button>
          <button className="btn" aria-label="축소" onClick={() => zoomAt(1 / 1.6, size.current.w / 2, size.current.h / 2)}>
            －
          </button>
          <button className="btn" aria-label="내 동네로 이동" onClick={() => currentIdx >= 0 && flyTo(currentIdx, 9)}>
            🎯
          </button>
          <button
            className="btn"
            aria-label="전국 보기"
            onClick={() => {
              view.current = { cx: (BOUNDS.minX + BOUNDS.maxX) / 2, cy: (BOUNDS.minY + BOUNDS.maxY) / 2, zoom: 1 };
              drawBase();
              setTip(null);
            }}
          >
            🗺️
          </button>
        </div>
        {tip && tipDong && tipProfile && (
          <div className="galaxy-tip" style={{ left: tip.x, top: tip.y }}>
            <div className="gs">
              {tipDong.sidoShort} {tipDong.sigungu}
            </div>
            <div className="gn">{tipDong.name}</div>
            <div className="gt" style={{ color: tipProfile.colors[0] }}>
              {tipProfile.emoji} {tipDong.type} · <span style={{ fontFamily: "var(--font-kr)" }}>{tipProfile.nick}</span>
            </div>
            <div className="gs">가게 {fmt(tipDong.total)}곳</div>
            {tipDong.code !== dong.code && (
              <button className="btn small primary" onClick={() => onPick(tipDong)}>
                이 동네 결과 보기 →
              </button>
            )}
          </div>
        )}
        <div className="galaxy-count">
          ✨ {fmt(shownCount)}개 동네 표시 중 · 드래그로 이동, 휠/핀치로 확대
        </div>
      </div>

      <div className="legend">
        <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          전체
        </button>
        <button className={`chip ${filter === "same" ? "active" : ""}`} onClick={() => setFilter("same")}>
          {dong.type}만 보기
        </button>
        {TYPE_ORDER.map((t) => (
          <button key={t} className={`chip ${filter === t ? "active" : ""}`} onClick={() => setFilter(filter === t ? "all" : t)}>
            <span className="dot" style={{ background: TYPES[t].colors[0] }} />
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
