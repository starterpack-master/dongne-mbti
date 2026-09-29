import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Dong, fmt, searchDongs } from "../lib/data";

interface Props {
  onPick: (d: Dong) => void;
  placeholder?: string;
  autoFocus?: boolean;
  excludeCode?: string;
  className?: string;
}

function highlight(name: string, query: string) {
  const q = query.trim().split(/\s+/).pop() ?? "";
  if (!q) return name;
  const i = name.indexOf(q);
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <mark>{name.slice(i, i + q.length)}</mark>
      {name.slice(i + q.length)}
    </>
  );
}

export default function SearchBox({ onPick, placeholder = "동네 이름 입력 (예: 연남동, 성수, 해운대)", autoFocus, excludeCode, className }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(
    () => searchDongs(q, 9).filter((d) => d.code !== excludeCode).slice(0, 8),
    [q, excludeCode],
  );

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (d: Dong) => {
    setQ("");
    setOpen(false);
    onPick(d);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) setOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const d = results[active];
      if (d) pick(d);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && q.trim().length > 0;

  return (
    <div className={`search-wrap ${className ?? ""}`} ref={wrapRef}>
      <div className="search-box">
        <span className="search-icon" aria-hidden="true">🔎</span>
        <input
          value={q}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="동네 검색"
          enterKeyHint="search"
        />
      </div>
      {showList && (
        <ul className="suggest" id={listId} role="listbox">
          {results.length === 0 && <li className="empty">앗, 그런 동네를 못 찾았어요. 행정동 이름으로 검색해 보세요 🙏</li>}
          {results.map((d, i) => (
            <li key={d.code} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? "on" : ""}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(d)}
              >
                <span aria-hidden="true">📍</span>
                <span>
                  <div className="s-name">{highlight(d.name, q)}</div>
                  <div className="s-sub">
                    {d.sido} {d.sigungu} · 가게 {fmt(d.total)}곳
                  </div>
                </span>
                <span className="s-type" title="결과는 눌러서 확인!">????</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
