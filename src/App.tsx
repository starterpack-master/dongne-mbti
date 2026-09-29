import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Background from "./components/Background";
import Landing from "./components/Landing";
import Result from "./components/Result";
import Reveal from "./components/Reveal";
import SearchBox from "./components/SearchBox";
import { Dong, findDong, randomDong } from "./lib/data";
import { josa } from "./lib/josa";
import { profileOf } from "./lib/types";

interface Route {
  code: string | null;
  vs: string | null;
}

function parseHash(): Route {
  const m = window.location.hash.match(/^#\/d\/(\d+)(?:\/vs\/(\d+))?/);
  return { code: m?.[1] ?? null, vs: m?.[2] ?? null };
}

const DEFAULT_COLORS: [string, string, string] = ["#ff4fd8", "#ffb800", "#1fd6ff"];

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [revealing, setRevealing] = useState<boolean>(() => parseHash().code !== null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const pendingScroll = useRef<string | null>(parseHash().vs ? "battle" : null);

  const dong = findDong(route.code);
  const rival = findDong(route.vs) ?? null;

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  // hash routing
  const currentCode = useRef<string | null>(route.code);
  useEffect(() => {
    const onHash = () => {
      const next = parseHash();
      if (next.code && next.code !== currentCode.current) setRevealing(true);
      if (next.vs) pendingScroll.current = "battle";
      currentCode.current = next.code;
      setRoute(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // unknown code in the URL → back home
  useEffect(() => {
    if (route.code && !dong) {
      toast("그 동네는 찾을 수 없어요. 다시 검색해 주세요!");
      window.location.hash = "";
    }
  }, [route.code, dong, toast]);

  // theme colors follow the current type
  useEffect(() => {
    const colors = dong ? profileOf(dong.type).colors : DEFAULT_COLORS;
    const root = document.documentElement.style;
    root.setProperty("--c1", colors[0]);
    root.setProperty("--c2", colors[1]);
    root.setProperty("--c3", colors[2]);
    document.title = dong
      ? `${dong.name}${josa(dong.name, "은", "는")} ${dong.type}? · 우리 동네 MBTI`
      : "우리 동네 MBTI — 전국 277만 가게로 본 동네 성격";
  }, [dong]);

  const goDong = useCallback((d: Dong) => {
    window.location.hash = `#/d/${d.code}`;
  }, []);

  const goHome = () => {
    window.location.hash = "";
    window.scrollTo({ top: 0 });
  };

  const setRival = useCallback(
    (r: Dong | null) => {
      if (!route.code) return;
      const hash = `#/d/${route.code}${r ? `/vs/${r.code}` : ""}`;
      window.history.replaceState(null, "", hash);
      setRoute({ code: route.code, vs: r ? r.code : null });
    },
    [route.code],
  );

  const onRevealDone = () => {
    setRevealing(false);
    window.scrollTo({ top: 0 });
    if (pendingScroll.current) {
      const id = pendingScroll.current;
      pendingScroll.current = null;
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    }
  };

  return (
    <>
      <Background />
      <div className="app">
        {dong ? (
          <>
            <header className="topbar">
              <div className="container">
                <button className="brand" onClick={goHome} aria-label="처음으로">
                  🏘️ 우리 동네 <span className="mini grad-text">MBTI</span>
                </button>
                <div className="spacer" />
                <SearchBox onPick={goDong} placeholder="다른 동네 검색" className="mini-search" />
                <button className="btn small" onClick={() => goDong(randomDong())} aria-label="랜덤 동네">
                  🎲
                </button>
              </div>
            </header>
            {!revealing && <Result key={dong.code} dong={dong} rival={rival} setRival={setRival} onPick={goDong} toast={toast} />}
          </>
        ) : (
          <Landing onPick={goDong} toast={toast} />
        )}
      </div>

      <AnimatePresence>{dong && revealing && <Reveal key={dong.code} dong={dong} onDone={onRevealDone} />}</AnimatePresence>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
