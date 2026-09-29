import { CSSProperties, useEffect, useRef } from "react";
import { BASE_LABEL, Dong, GROUPS, fmt, topPercentLabel, typeCount } from "../lib/data";
import { AXES, profileOf } from "../lib/types";

interface Props {
  dong: Dong;
}

/** Holographic 3D photocard that tilts with the pointer and idles with a gentle wobble. */
export default function PhotoCard({ dong }: Props) {
  const p = profileOf(dong.type);
  const ref = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const set = (rx: number, ry: number, mx: number, my: number) => {
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--mx", `${mx.toFixed(1)}%`);
      el.style.setProperty("--my", `${my.toFixed(1)}%`);
    };
    const idle = (t: number) => {
      if (!hovering.current) {
        const a = t / 1800;
        set(Math.sin(a) * 5, Math.cos(a * 0.8) * 7, 50 + Math.cos(a * 0.8) * 30, 40 + Math.sin(a) * 25);
      }
      raf = requestAnimationFrame(idle);
    };
    if (!reduce) raf = requestAnimationFrame(idle);

    const onMove = (e: PointerEvent) => {
      hovering.current = true;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      set((0.5 - y) * 22, (x - 0.5) * 26, x * 100, y * 100);
    };
    const onLeave = () => {
      hovering.current = false;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  const style = {
    "--p1": p.colors[0],
    "--p2": p.colors[1],
    "--p3": p.colors[2],
  } as CSSProperties;

  return (
    <div className="card-stage">
      <div className="photocard" ref={ref} style={style} aria-label={`${dong.name} ${dong.type} 포토카드`}>
        <div className="pc-bg" />
        <div className="pc-holo" />
        <div className="pc-glitter" />
        <div className="pc-shine" />
        <div className="pc-vig" />
        <div className="pc-frame" />
        <div className="pc-content">
          <div className="pc-head">
            <span className="pc-pill">🏘️ 우리 동네 MBTI</span>
            <span>{BASE_LABEL} 기준</span>
          </div>
          <div className="pc-loc">
            {dong.sidoShort} {dong.sigungu}
          </div>
          <div className="pc-name">{dong.name}</div>
          <div className="pc-type">{dong.type}</div>
          <div className="pc-nick">
            {p.emoji} {p.nick}
          </div>
          <div className="pc-tagline">“{p.tagline}”</div>
          <div className="pc-bars">
            {AXES.map((ax, j) => {
              const pct = dong.axes[j];
              const winFirst = pct >= 50;
              const win = winFirst ? pct : 100 - pct;
              return (
                <div className="pc-bar" key={ax.first}>
                  <span className={winFirst ? "" : "dim"}>{ax.first}</span>
                  <div className="pc-track">
                    <div
                      className="pc-fill"
                      style={winFirst ? { left: 0, width: `${win}%` } : { right: 0, width: `${win}%` }}
                    />
                  </div>
                  <span className={winFirst ? "dim" : ""}>{ax.second}</span>
                  <span className="pv">{win}%</span>
                </div>
              );
            })}
          </div>
          <div className="pc-badges">
            {dong.top.slice(0, 3).map((gi) => (
              <span className="pc-badge" key={gi}>
                {GROUPS[gi].emoji} {GROUPS[gi].label} {topPercentLabel(dong.pct[gi])}
              </span>
            ))}
          </div>
          <div className="pc-foot">
            <span>
              가게 {fmt(dong.total)}곳 분석
              {dong.rank > 0 && ` · ${dong.type} ${fmt(typeCount(dong.type))}곳 중 ${fmt(dong.rank)}위`}
            </span>
            <span>#우리동네MBTI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
