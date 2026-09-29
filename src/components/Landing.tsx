import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { BASE_LABEL, DONGS, Dong, TOTAL_STORES, fmt, nearestDong, pickByName, randomDong } from "../lib/data";
import { TYPES, TYPE_ORDER } from "../lib/types";
import SearchBox from "./SearchBox";

interface Props {
  onPick: (d: Dong) => void;
  toast: (msg: string) => void;
}

const EXAMPLES: [string, string][] = [
  ["연남동", "마포"],
  ["성수2가3동", "성동"],
  ["여의동", "영등포"],
  ["대치4동", "강남"],
  ["이태원1동", "용산"],
  ["우1동", "해운대"],
  ["애월읍", "제주"],
  ["주문진읍", "강릉"],
  ["대학동", "관악"],
];

export default function Landing({ onPick, toast }: Props) {
  const [locating, setLocating] = useState(false);
  const examples = useMemo(
    () => EXAMPLES.map(([n, h]) => pickByName(n, h)).filter((d): d is Dong => Boolean(d)),
    [],
  );

  const locate = () => {
    if (!("geolocation" in navigator)) {
      toast("이 브라우저는 위치 찾기를 지원하지 않아요 😢");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onPick(nearestDong(pos.coords.latitude, pos.coords.longitude));
      },
      () => {
        setLocating(false);
        toast("위치 권한이 없어서 못 찾았어요. 동네 이름으로 검색해 주세요!");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  return (
    <main className="landing container">
      <div className="hero">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          📡 전국 가게 <b>{fmt(TOTAL_STORES)}곳</b> · 행정동 <b>{fmt(DONGS.length)}개</b> 분석 완료
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 16 }}
        >
          우리 동네
          <span className="mbti">MBTI</span>
        </motion.h1>

        <motion.p
          className="hero-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          카페가 많으면 <b>감성파 N</b>, 술집이 많으면 <b>밖순이 E</b>.<br />
          동네에 어떤 가게가 모여 있는지로 <b>동네 성격</b>을 뽑아 드려요.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <SearchBox onPick={onPick} autoFocus={!window.matchMedia("(pointer: coarse)").matches} />
          <div className="row quick">
            <button className="btn" onClick={locate} disabled={locating}>
              {locating ? "📡 찾는 중..." : "📍 내 위치로 찾기"}
            </button>
            <button className="btn" onClick={() => onPick(randomDong())}>
              🎲 아무 동네나 뽑기
            </button>
          </div>
          <div className="row examples">
            <div className="examples-label">요즘 많이 궁금해하는 동네</div>
            {examples.map((d) => (
              <button key={d.code} className="chip" onClick={() => onPick(d)}>
                {d.name} <span style={{ color: "var(--dim)", fontWeight: 600 }}>{d.sigungu}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...TYPE_ORDER, ...TYPE_ORDER].map((t, i) => {
            const p = TYPES[t];
            return (
              <div key={`${t}-${i}`} className="type-pill">
                <div className="sw" style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }}>
                  {p.emoji}
                </div>
                <div>
                  <div className="tc">{t}</div>
                  <div className="tn">{p.nick}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="footer-note">
        데이터: 소상공인시장진흥공단 상가(상권)정보 ({BASE_LABEL} 기준, 공공데이터포털) · 재미로 보는 분석이에요.
        <br />
        실제 주민 성격과는 관계없어요. 우리 동네 가게 구성의 "분위기"를 보여줄 뿐 🙂
      </p>
    </main>
  );
}
