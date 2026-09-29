import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { downloadBlob, renderCardPng } from "../lib/card";
import { copyText } from "../lib/clipboard";
import { BASE_LABEL, DONGS, Dong, MIN_TOTAL_FOR_RANK, TOTAL_STORES, fmt, isReliable, typeCount } from "../lib/data";
import { josa } from "../lib/josa";
import { profileOf } from "../lib/types";
import AxisBars from "./AxisBars";
import Battle from "./Battle";
import Compat from "./Compat";
import Galaxy from "./Galaxy";
import Ingredients from "./Ingredients";
import PhotoCard from "./PhotoCard";

interface Props {
  dong: Dong;
  rival: Dong | null;
  setRival: (d: Dong | null) => void;
  onPick: (d: Dong) => void;
  toast: (msg: string) => void;
}

export const shareUrlFor = (d: Dong, vs?: Dong) => {
  const base = window.location.href.split("#")[0];
  return `${base}#/d/${d.code}${vs ? `/vs/${vs.code}` : ""}`;
};

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as const },
};

export default function Result({ dong, rival, setRival, onPick, toast }: Props) {
  const p = profileOf(dong.type);
  const [busy, setBusy] = useState<"" | "save" | "share">("");
  const fileName = `우리동네MBTI_${dong.name}_${dong.type}.png`;
  const shareText = `우리 동네 ${dong.name}${josa(dong.name, "은", "는")} ${dong.type} ${p.nick}래 ${p.emoji} 너네 동네는 뭐 나와?`;

  // Pre-render the photocard in the background so "공유" can call navigator.share
  // right inside the click (Safari drops the user gesture after long awaits).
  const cardBlob = useRef<Promise<Blob> | null>(null);
  useEffect(() => {
    cardBlob.current = null;
    const t = window.setTimeout(() => {
      cardBlob.current = renderCardPng(dong).catch((e) => {
        cardBlob.current = null;
        throw e;
      });
    }, 900);
    return () => window.clearTimeout(t);
  }, [dong]);
  const getCard = () => cardBlob.current ?? (cardBlob.current = renderCardPng(dong));

  const save = async () => {
    setBusy("save");
    try {
      const blob = await getCard();
      downloadBlob(blob, fileName);
      toast("📸 포토카드 저장 완료! 인스타 스토리에 올려 보세요");
    } catch {
      toast("저장 중 문제가 생겼어요. 다시 시도해 주세요");
    } finally {
      setBusy("");
    }
  };

  const share = async () => {
    const url = shareUrlFor(dong);
    const copyFallback = async () => {
      const ok = await copyText(`${shareText}\n${url}`);
      toast(ok ? "🔗 공유 문구와 링크를 복사했어요! 단톡방에 붙여넣기 ㄱㄱ" : "공유가 막혀 있어요. 포토카드를 저장해서 올려 주세요!");
    };
    // No share sheet (most desktop browsers): copy right away, still inside the click.
    if (typeof navigator.share !== "function") {
      await copyFallback();
      return;
    }
    setBusy("share");
    try {
      const blob = await getCard();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "우리 동네 MBTI", text: `${shareText}\n${url}` });
      } else {
        await navigator.share({ title: "우리 동네 MBTI", text: shareText, url });
      }
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") await copyFallback();
    } finally {
      setBusy("");
    }
  };

  return (
    <main className="container">
      <section className="result-hero">
        <motion.div
          initial={{ opacity: 0, rotateY: -30, scale: 0.9 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
        >
          <PhotoCard dong={dong} />
          <div className="card-hint">🪄 카드를 움직여 보세요 · 홀로그램 포카</div>
        </motion.div>

        <motion.div
          className="result-info"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="loc">
            📍 {dong.sido} {dong.sigungu}
          </div>
          <h1>{dong.name}</h1>
          <div className="type-line">
            <span className="type-code grad-text">{dong.type}</span>
            <span className="type-nick">
              {p.emoji} {p.nick}
            </span>
          </div>
          <p className="result-desc">{p.desc}</p>
          <div className="row tags">
            {p.tags.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
          <div className="stat-row">
            <div className="stat">
              <div className="k">분석한 가게</div>
              <div className="v">{fmt(dong.total)}곳</div>
            </div>
            <div className="stat">
              <div className="k">{dong.type} 순위</div>
              <div className="v">{dong.rank > 0 ? `${fmt(dong.rank)}위` : "-"}</div>
            </div>
            <div className="stat">
              <div className="k">같은 유형</div>
              <div className="v">{fmt(typeCount(dong.type))}곳</div>
            </div>
          </div>
          <div className="row actions">
            <button className="btn primary" onClick={save} disabled={busy !== ""}>
              {busy === "save" ? "만드는 중..." : "📸 포토카드 저장"}
            </button>
            <button className="btn" onClick={share} disabled={busy !== ""}>
              {busy === "share" ? "준비 중..." : "💌 친구한테 공유"}
            </button>
          </div>
          {!isReliable(dong) && (
            <div className="warn">
              ⚠️ 가게가 {MIN_TOTAL_FOR_RANK}곳 미만인 동네라 결과가 흔들릴 수 있어요. 재미로만 봐 주세요!
            </div>
          )}
        </motion.div>
      </section>

      <motion.section className="section glass" {...reveal}>
        <div className="section-head">
          <div>
            <div className="kicker">🔬 분석 결과</div>
            <h2 className="section-title">왜 {dong.type}일까?</h2>
            <p className="section-sub">전국 평균보다 유난히 많거나 적은 가게가 이 동네의 성격을 만들어요.</p>
          </div>
        </div>
        <AxisBars dong={dong} />
      </motion.section>

      <motion.section className="section glass" {...reveal}>
        <div className="section-head">
          <div>
            <div className="kicker">🧾 과몰입 모드</div>
            <h2 className="section-title">동네 성분표</h2>
            <p className="section-sub">과자 봉지 뒷면처럼, 이 동네는 뭘로 만들어졌을까?</p>
          </div>
        </div>
        <Ingredients dong={dong} />
      </motion.section>

      <motion.section className="section glass" {...reveal}>
        <div className="section-head">
          <div>
            <div className="kicker">💘 궁합</div>
            <h2 className="section-title">나랑 이 동네, 궁합 몇 점?</h2>
            <p className="section-sub">내 MBTI를 맞추면 궁합 점수와 나랑 찰떡인 동네를 추천해 드려요.</p>
          </div>
        </div>
        <Compat dong={dong} onPick={onPick} />
      </motion.section>

      <motion.section className="section glass" id="battle" {...reveal}>
        <div className="section-head">
          <div>
            <div className="kicker">⚔️ 동네 배틀</div>
            <h2 className="section-title">친구 동네랑 붙어 보기</h2>
            <p className="section-sub">카페·술집·빵집·운동… 8라운드 가게 밀도 대결!</p>
          </div>
        </div>
        <Battle dong={dong} rival={rival} setRival={setRival} onPick={onPick} toast={toast} shareUrl={(vs) => shareUrlFor(dong, vs)} />
      </motion.section>

      <motion.section className="section glass" {...reveal}>
        <div className="section-head">
          <div>
            <div className="kicker">🌌 동네 은하계</div>
            <h2 className="section-title">전국 {fmt(DONGS.length)}개 동네 MBTI 지도</h2>
            <p className="section-sub">점 하나가 동네 하나. 색은 MBTI 유형이에요. 눌러서 다른 동네도 구경해 보세요.</p>
          </div>
        </div>
        <Galaxy dong={dong} onPick={onPick} />
      </motion.section>

      <motion.section className="section glass method" {...reveal}>
        <h2 className="section-title" style={{ color: "var(--text)" }}>
          🧪 어떻게 계산했나요?
        </h2>
        <ul>
          <li>
            <b>데이터</b>: 소상공인시장진흥공단 상가(상권)정보 ({BASE_LABEL} 기준, 공공데이터포털) 전국 가게{" "}
            {fmt(TOTAL_STORES)}곳을 행정동별로 모았어요.
          </li>
          <li>
            <b>방법</b>: 업종마다 "이 동네 비율 ÷ 전국 비율"을 구하고, 4개 축(E/I 밖·집, S/N 생활·감성, T/F 갓생·힐링,
            J/P 루틴·즉흥)에 해당하는 업종들의 차이로 점수를 냈어요. 가게가 적은 동네는 전국 평균 쪽으로 보정했고, 축끼리
            겹치지 않도록 통계적으로 정리했어요.
          </li>
          <li>
            <b>주의</b>: 가게 구성의 분위기를 재미로 보여주는 것일 뿐, 실제 주민 성격이나 살기 좋은 정도를 뜻하지 않아요.
          </li>
        </ul>
      </motion.section>

      <footer className="page-foot">
        우리 동네 MBTI · 데이터 출처: 소상공인시장진흥공단 상가(상권)정보 ({BASE_LABEL}), 공공데이터포털 (이용허락범위 제한 없음)
      </footer>
    </main>
  );
}
