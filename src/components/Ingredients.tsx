import { motion } from "framer-motion";
import { Dong, GROUPS, fmt, ratio, share } from "../lib/data";
import { profileOf } from "../lib/types";

const EXTRA = ["#7c5cff", "#22d3ee", "#fb7185", "#a3e635", "#f59f00", "#94a3b8"];

export default function Ingredients({ dong }: { dong: Dong }) {
  const p = profileOf(dong.type);
  const rows = GROUPS.map((g, gi) => ({ g, gi, s: share(dong, gi), r: ratio(dong, gi), c: dong.groups[gi] }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.s - a.s);

  const top = rows.slice(0, 6);
  const covered = top.reduce((acc, x) => acc + x.s, 0);
  const palette = [p.colors[0], p.colors[1], p.colors[2], ...EXTRA];
  const segs = [...top.map((x, i) => ({ label: `${x.g.emoji} ${x.g.label}`, v: x.s, color: palette[i] })), {
    label: "✨ 기타",
    v: Math.max(0, 1 - covered),
    color: "rgba(255,255,255,0.18)",
  }];

  const R = 80;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="ingredients">
      <div className="nutri" role="table" aria-label="동네 성분표">
        <h3>동네 성분표</h3>
        <div className="serv">
          <span>1회 제공량 동네 1개</span>
          <span>가게 {fmt(dong.total)}곳</span>
        </div>
        <div className="hdr">
          <span>성분</span>
          <span>함량 · 전국 평균 대비</span>
        </div>
        {rows.slice(0, 10).map(({ g, s, r, c }) => (
          <div className="item" key={g.key} role="row">
            <span className="nm">
              {g.emoji} {g.label} <span className="ct">{fmt(c)}곳</span>
            </span>
            <span>{(s * 100).toFixed(1)}%</span>
            <span className={`rt ${r >= 1.5 ? "hot" : ""}`}>
              {r >= 1.5 ? "🔥" : ""}
              {r.toFixed(1)}배
            </span>
          </div>
        ))}
        <div className="foot">
          * 함량 = 동네 전체 가게 중 비율, 배수 = 전국 평균 비율 대비. 1.5배 이상이면 🔥
          <br />* 원재료: 소상공인시장진흥공단 상가(상권)정보. 과몰입 주의.
        </div>
      </div>

      <div className="donut-wrap">
        <svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="업종 구성 도넛 차트">
          <g transform="translate(110 110) rotate(-90)">
            <circle r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="34" />
            {segs.map((s, i) => {
              const len = s.v * C;
              const el = (
                <motion.circle
                  key={i}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="34"
                  strokeDasharray={`${len} ${C - len}`}
                  initial={{ strokeDashoffset: -offset + len, opacity: 0 }}
                  whileInView={{ strokeDashoffset: -offset, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
                />
              );
              offset += len;
              return el;
            })}
          </g>
          <text x="110" y="104" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">
            가게
          </text>
          <text x="110" y="130" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="900">
            {fmt(dong.total)}
          </text>
        </svg>
        <div className="donut-legend">
          {segs.map((s) => (
            <div key={s.label}>
              <span className="sw" style={{ background: s.color }} />
              {s.label} {(s.v * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
