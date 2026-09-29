import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { copyText } from "../lib/clipboard";
import { Dong, GROUPS, groupIndex, neighborOf, randomDong } from "../lib/data";
import { josa } from "../lib/josa";
import { profileOf } from "../lib/types";
import SearchBox from "./SearchBox";

const ROUNDS = ["cafe", "bar", "dessert", "fitness", "beauty", "play", "study", "pet"];

interface Props {
  dong: Dong;
  rival: Dong | null;
  setRival: (d: Dong | null) => void;
  onPick: (d: Dong) => void;
  toast: (msg: string) => void;
  shareUrl: (vs?: Dong) => string;
}

const density = (d: Dong, gi: number) => (d.total ? (d.groups[gi] / d.total) * 1000 : 0);

export default function Battle({ dong, rival, setRival, onPick, toast, shareUrl }: Props) {
  const neighbor = useMemo(() => neighborOf(dong), [dong]);

  const rounds = useMemo(() => {
    if (!rival) return [];
    return ROUNDS.map((key) => {
      const gi = groupIndex(key);
      const a = density(dong, gi);
      const b = density(rival, gi);
      const max = Math.max(a, b, 0.0001);
      const winner: "a" | "b" | "draw" = Math.abs(a - b) < 0.05 ? "draw" : a > b ? "a" : "b";
      return { gi, a, b, max, winner, ca: dong.groups[gi], cb: rival.groups[gi] };
    });
  }, [dong, rival]);

  const winsA = rounds.filter((r) => r.winner === "a").length;
  const winsB = rounds.filter((r) => r.winner === "b").length;

  useEffect(() => {
    if (!rival) return;
    const t = setTimeout(() => {
      const w = winsA === winsB ? null : winsA > winsB ? dong : rival;
      const colors = w ? profileOf(w.type).colors : ["#ffffff", "#ffd43b"];
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.8 }, colors: [...colors], zIndex: 60 });
    }, 1300);
    return () => clearTimeout(t);
  }, [rival, dong, winsA, winsB]);

  if (!rival) {
    return (
      <div className="battle-pick">
        <SearchBox onPick={setRival} placeholder="붙어 볼 동네 검색 (예: 망원동)" excludeCode={dong.code} />
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn small" onClick={() => setRival(neighbor)}>
            🏘️ 옆 동네 {neighbor.name}
            {josa(neighbor.name, "이랑", "랑")} 붙기
          </button>
          <button className="btn small" onClick={() => setRival(randomDong())}>
            🎲 랜덤 상대
          </button>
        </div>
      </div>
    );
  }

  const pa = profileOf(dong.type);
  const pb = profileOf(rival.type);
  const verdict =
    winsA === winsB
      ? "🤝 무승부! 둘 다 매력 있는 동네"
      : `🏆 ${winsA > winsB ? dong.name : rival.name} 승리!`;

  const copy = async () => {
    const text = `⚔️ 동네 배틀 ${dong.name}(${dong.type}) ${winsA} : ${winsB} ${rival.name}(${rival.type}) — ${verdict}\n${shareUrl(rival)}`;
    toast(
      (await copyText(text))
        ? "배틀 결과를 복사했어요! 단톡방에 붙여넣기 ㄱㄱ"
        : "복사가 막혀 있어요. 화면을 캡처해서 공유해 주세요!",
    );
  };

  return (
    <div>
      <div className="vs-head">
        <div className="vs-side">
          <div className="vs-sub">
            {dong.sidoShort} {dong.sigungu}
          </div>
          <div className="vn">{dong.name}</div>
          <span className="vt" style={{ color: pa.colors[0] }}>
            {pa.emoji} {dong.type}
          </span>
        </div>
        <motion.div
          className="vs-badge"
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: -6 }}
          transition={{ type: "spring", stiffness: 260, damping: 12 }}
        >
          VS
        </motion.div>
        <button className="vs-side" style={{ background: "none", border: "none" }} onClick={() => onPick(rival)} title="이 동네 결과 보기">
          <div className="vs-sub">
            {rival.sidoShort} {rival.sigungu}
          </div>
          <div className="vn">{rival.name}</div>
          <span className="vt" style={{ color: pb.colors[0] }}>
            {pb.emoji} {rival.type}
          </span>
        </button>
      </div>

      {rounds.map((r, i) => (
        <motion.div
          key={r.gi}
          className="round"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * i }}
        >
          <div className={`side left ${r.winner === "a" ? "win" : ""}`}>
            <motion.div
              className="bar"
              initial={{ width: 0 }}
              animate={{ width: `${(r.a / r.max) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.08 * i + 0.2 }}
            />
            <span className="num">{r.ca}곳</span>
            {r.winner === "a" && <span className="crown">👑</span>}
          </div>
          <div className="lbl">
            {GROUPS[r.gi].emoji} {GROUPS[r.gi].label}
          </div>
          <div className={`side ${r.winner === "b" ? "win" : ""}`}>
            <motion.div
              className="bar"
              initial={{ width: 0 }}
              animate={{ width: `${(r.b / r.max) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.08 * i + 0.2 }}
            />
            <span className="num">{r.cb}곳</span>
            {r.winner === "b" && <span className="crown">👑</span>}
          </div>
        </motion.div>
      ))}
      <div className="section-sub" style={{ textAlign: "center", marginTop: 6 }}>
        막대 길이는 가게 1,000곳당 밀도 기준 (큰 동네가 무조건 이기지 않게!)
      </div>

      <motion.div
        className="battle-result"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, type: "spring" }}
      >
        <span className="score">
          {winsA} : {winsB}
        </span>{" "}
        {verdict}
      </motion.div>
      <div className="row" style={{ justifyContent: "center", marginTop: 14 }}>
        <button className="btn small primary" onClick={copy}>
          📋 결과 복사해서 자랑하기
        </button>
        <button className="btn small" onClick={() => setRival(null)}>
          🔄 다른 상대 고르기
        </button>
      </div>
    </div>
  );
}
