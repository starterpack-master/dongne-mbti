import confetti from "canvas-confetti";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dong, fmt } from "../lib/data";
import { AXES, profileOf } from "../lib/types";

interface Props {
  dong: Dong;
  onDone: () => void;
}

const SCAN_EMOJI = ["☕", "🍺", "🥐", "💅", "🏋️", "🎮", "📚", "🐶", "🍗", "🛒", "🏪", "🧳", "🌸", "🥩"];
const REPEAT = 14;

export default function Reveal({ dong, onDone }: Props) {
  const p = profileOf(dong.type);
  const reduce = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);
  const [finished, setFinished] = useState(false);
  const doneRef = useRef(false);
  const count = useMotionValue(0);
  const countText = useTransform(count, (v) => fmt(Math.round(v)));

  const strips = useMemo(
    () =>
      AXES.map((ax, j) => {
        const final = dong.type[j];
        const cells: string[] = [];
        for (let i = 0; i < REPEAT; i++) cells.push(i % 2 === 0 ? ax.first : ax.second);
        cells.push(final);
        return cells;
      }),
    [dong.type],
  );

  const flyers = useMemo(
    () =>
      Array.from({ length: reduce ? 0 : 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
        const r = 55 + Math.random() * 20;
        return {
          e: SCAN_EMOJI[i % SCAN_EMOJI.length],
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          d: Math.random() * 1.1,
        };
      }),
    [reduce],
  );

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const ctrl = animate(count, dong.total, { duration: reduce ? 0.2 : 1.5, ease: "easeOut" });
    return () => ctrl.stop();
  }, [count, dong.total, reduce]);

  useEffect(() => {
    if (!done.every(Boolean) || finished) return;
    setFinished(true);
    if (!reduce) {
      const colors = [...p.colors, "#ffffff"];
      confetti({ particleCount: 140, spread: 100, startVelocity: 45, origin: { y: 0.55 }, colors, zIndex: 60 });
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors, zIndex: 60 });
        confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors, zIndex: 60 });
      }, 220);
    }
    const t = setTimeout(finish, reduce ? 500 : 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <motion.div className="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button className="btn small reveal-skip" onClick={finish}>
        건너뛰기 ⏭
      </button>
      {flyers.map((f, i) => (
        <motion.div
          key={i}
          className="fly-emoji"
          style={{ left: "50%", top: "46%" }}
          initial={{ x: `${f.x}vw`, y: `${f.y}vh`, opacity: 0, scale: 1.4 }}
          animate={{ x: 0, y: 0, opacity: [0, 1, 0], scale: 0.3 }}
          transition={{ duration: 1.2, delay: f.d, ease: "easeIn" }}
        >
          {f.e}
        </motion.div>
      ))}
      <div className="reveal-inner">
        <div className="reveal-loc">
          {dong.sido} {dong.sigungu}
        </div>
        <div className="reveal-name">{dong.name}</div>
        <div className="scan-line">
          📡 가게 <motion.b>{countText}</motion.b>곳 스캔 중...
        </div>
        <div className="progress">
          <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: reduce ? 0.3 : 3.2, ease: "easeInOut" }} />
        </div>
        <div className="reels" aria-label={`결과 ${dong.type}`}>
          {strips.map((cells, j) => (
            <div key={j} className={`reel ${done[j] ? "done" : ""}`}>
              <motion.div
                className="reel-strip"
                style={{ height: `${cells.length * 100}%` }}
                initial={{ y: "0%" }}
                animate={{ y: `-${((cells.length - 1) / cells.length) * 100}%` }}
                transition={{
                  duration: reduce ? 0.25 : 1.5 + j * 0.45,
                  ease: [0.15, 0.75, 0.2, 1],
                }}
                onAnimationComplete={() =>
                  setDone((prev) => {
                    if (prev[j]) return prev;
                    const next = [...prev];
                    next[j] = true;
                    return next;
                  })
                }
              >
                {cells.map((c, i) => (
                  <div key={i} className="reel-cell" style={{ height: `${100 / cells.length}%` }}>
                    {c}
                  </div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
        <motion.div
          className="reveal-nick"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={finished ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
        >
          {p.emoji} <span className="grad-text">{p.nick}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
