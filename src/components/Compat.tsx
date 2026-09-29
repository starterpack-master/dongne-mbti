import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { BEST, bestDongsFor, compat } from "../lib/compat";
import { Dong } from "../lib/data";
import { josa } from "../lib/josa";
import { AXES, profileOf } from "../lib/types";

const KEY = "dongne-mbti:me";

interface Props {
  dong: Dong;
  onPick: (d: Dong) => void;
}

function loadMe(): (string | null)[] {
  try {
    const v = localStorage.getItem(KEY);
    if (v && /^[EI][SN][TF][JP]$/.test(v)) return v.split("");
  } catch {
    /* ignore */
  }
  return [null, null, null, null];
}

export default function Compat({ dong, onPick }: Props) {
  const [me, setMe] = useState<(string | null)[]>(loadMe);
  const complete = me.every(Boolean);
  const meType = complete ? me.join("") : "";

  useEffect(() => {
    if (!complete) return;
    try {
      localStorage.setItem(KEY, meType);
    } catch {
      /* ignore */
    }
  }, [complete, meType]);

  const flip = (j: number) =>
    setMe((prev) => {
      const next = [...prev];
      const ax = AXES[j];
      next[j] = prev[j] === ax.first ? ax.second : ax.first;
      return next;
    });

  const result = useMemo(() => (complete ? compat(meType, dong.type) : null), [complete, meType, dong.type]);
  const reco = useMemo(
    () => (complete ? bestDongsFor(meType, dong.sido, dong.code) : null),
    [complete, meType, dong.sido, dong.code],
  );

  const R = 64;
  const C = 2 * Math.PI * R;

  return (
    <div>
      <div className="compat">
        <div>
          <div className="flip-row">
            {AXES.map((ax, j) => (
              <button
                key={ax.first}
                className="flip"
                onClick={() => flip(j)}
                aria-label={`${ax.first} 또는 ${ax.second} 선택`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={me[j] ?? "?"}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className={me[j] ? "grad-text" : ""}
                    style={{ display: "inline-block" }}
                  >
                    {me[j] ?? "?"}
                  </motion.span>
                </AnimatePresence>
                <small>
                  {ax.first} / {ax.second}
                </small>
              </button>
            ))}
          </div>
          <div className="flip-help">👆 칸을 눌러서 내 MBTI를 맞춰 주세요 (누를 때마다 바뀌어요)</div>
        </div>

        <div className="gauge-wrap">
          {result ? (
            <>
              <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true">
                <circle cx="85" cy="85" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                <motion.circle
                  key={`${meType}-${dong.code}`}
                  cx="85"
                  cy="85"
                  r={R}
                  fill="none"
                  stroke="url(#gg)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  transform="rotate(-90 85 85)"
                  strokeDasharray={C}
                  initial={{ strokeDashoffset: C }}
                  animate={{ strokeDashoffset: C * (1 - result.score / 100) }}
                  transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
                />
                <defs>
                  <linearGradient id="gg" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" style={{ stopColor: "var(--c1)" }} />
                    <stop offset="100%" style={{ stopColor: "var(--c2)" }} />
                  </linearGradient>
                </defs>
                <text x="85" y="96" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="900" fontFamily="Unbounded, sans-serif">
                  {result.score}
                </text>
              </svg>
              <div className="gauge-title">
                {meType} × {dong.type} · {result.title}
              </div>
              <div className="gauge-line">{result.line}</div>
            </>
          ) : (
            <div className="gauge-line" style={{ fontSize: 16 }}>
              내 MBTI 4칸을 채우면
              <br />
              <b style={{ color: "var(--text)" }}>{dong.name}</b>
              {josa(dong.name, "과", "와")}의 궁합 점수가 나와요 💘
            </div>
          )}
        </div>
      </div>

      {reco && complete && (
        <div className="reco">
          <div style={{ fontWeight: 900, fontSize: 17 }}>
            🧭 {meType}와 찰떡인 동네 ({reco.scope} TOP {reco.list.length})
          </div>
          <div className="section-sub" style={{ marginTop: 4 }}>
            {meType}의 찰떡 유형 {(BEST[meType] ?? []).join(" · ")} 중에서 그 유형 느낌이 가장 강한 동네들
          </div>
          <div className="reco-list">
            {reco.list.map((d) => {
              const rp = profileOf(d.type);
              return (
                <button key={d.code} className="reco-item" onClick={() => onPick(d)}>
                  <div className="rn">{d.name}</div>
                  <div className="rs">
                    {d.sidoShort} {d.sigungu}
                  </div>
                  <span className="rt" style={{ background: `linear-gradient(135deg, ${rp.colors[0]}, ${rp.colors[1]})` }}>
                    {rp.emoji} {d.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
