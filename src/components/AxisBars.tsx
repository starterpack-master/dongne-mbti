import { motion } from "framer-motion";
import { Dong, fmt } from "../lib/data";
import { AXES } from "../lib/types";

const VERDICT: Record<string, string> = {
  E: "밖에서 모이고 마시는 가게가 많아요",
  I: "혼자·집에서 쓰는 가게가 많아요",
  S: "시장·생활 밀착 가게가 많아요",
  N: "카페·소품·세계 음식 같은 감성 가게가 많아요",
  T: "오피스·공부·운동 가게가 많아요",
  F: "뷰티·반려·케어 가게가 많아요",
  J: "학원·병원 같은 루틴 가게가 많아요",
  P: "놀거리·여행·레저 가게가 많아요",
};

export default function AxisBars({ dong }: { dong: Dong }) {
  return (
    <div className="axes">
      {AXES.map((ax, j) => {
        const pct = dong.axes[j];
        const winFirst = pct >= 50;
        const win = winFirst ? pct : 100 - pct;
        const letter = winFirst ? ax.first : ax.second;
        const ev = dong.evidence[j] ?? [];
        // position on the spectrum: 0% = fully first letter, 100% = fully second letter
        const pos = 100 - pct;
        const anim = { duration: 1.1, ease: [0.2, 0.8, 0.2, 1] as const, delay: j * 0.08 };
        return (
          <div className="axis" key={ax.first}>
            <div className="axis-top">
              <div className={`axis-letter ${winFirst ? "win" : "lose"}`}>
                <div className="L">{ax.first}</div>
                <div className="n">{ax.firstName}</div>
              </div>
              <div className="axis-track">
                <div className="axis-mid" />
                <motion.div
                  className="axis-fill"
                  initial={{ left: "50%", width: "0%" }}
                  whileInView={{ left: `${Math.min(50, pos)}%`, width: `${Math.abs(pos - 50)}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={anim}
                />
                <motion.div
                  className="axis-knob"
                  initial={{ left: "50%" }}
                  whileInView={{ left: `${pos}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={anim}
                />
              </div>
              <div className={`axis-letter ${winFirst ? "lose" : "win"}`}>
                <div className="L">{ax.second}</div>
                <div className="n">{ax.secondName}</div>
              </div>
            </div>
            <div className="axis-verdict">
              <span className="pct grad-text">
                {letter} {win}%
              </span>
              {VERDICT[letter]}
            </div>
            {ev.length > 0 && (
              <div className="evidence">
                {ev.map((e) =>
                  e.over ? (
                    <span key={e.category} className="ev">
                      📈 {e.category} {fmt(e.count)}곳 · 전국 평균의 <b>{e.ratio.toFixed(1)}배</b>
                    </span>
                  ) : (
                    <span key={e.category} className="ev under">
                      📉 {e.category}{" "}
                      {e.count === 0 ? (
                        <b>한 곳도 없음</b>
                      ) : (
                        <>
                          {fmt(e.count)}곳 · 전국 평균의 <b>{e.ratio.toFixed(1)}배</b>로 적음
                        </>
                      )}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
