import raw from "../data/dongs.json";

/** Evidence item: why an axis leaned toward its letter. */
export interface Evidence {
  category: string;
  count: number;
  /** ratio vs national share, e.g. 3.5 = 전국 평균의 3.5배 */
  ratio: number;
  /** true = this kind of store is common here, false = the opposite kind is rare */
  over: boolean;
}

export interface Dong {
  code: string;
  sido: string;
  sidoShort: string;
  sigungu: string;
  name: string;
  total: number;
  lat: number;
  lon: number;
  type: string;
  /** % of the FIRST letter on each axis: E, S, T, J (3..97) */
  axes: [number, number, number, number];
  groups: number[];
  /** share percentile per group among dongs with enough stores (0..100) */
  pct: number[];
  top: number[];
  /** 1 = most typical dong of its type nationwide, 0 = not ranked */
  rank: number;
  evidence: Evidence[][];
  /** normalized search haystack */
  hay: string;
  nameKey: string;
}

export interface Group {
  key: string;
  emoji: string;
  label: string;
  natShare: number;
}

type RawDong = [
  string, number, string, number, number, number, string,
  [number, number, number, number], number[], number[], number[], number,
  [number, number, number, number][][],
];

interface RawData {
  base: string;
  totalStores: number;
  minTotalForRank: number;
  groups: [string, string, string][];
  groupNatShare: number[];
  categories: string[];
  sigungus: [string, string][];
  typeCount: Record<string, number>;
  dongs: RawDong[];
}

const data = raw as unknown as RawData;

const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전남광주통합특별시: "전남광주",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

export const normalize = (s: string) =>
  s.toLowerCase().replace(/[\s·.,\-()]/g, "");

export const BASE_MONTH = data.base; // "202606"
export const BASE_LABEL = `${data.base.slice(0, 4)}.${data.base.slice(4, 6)}`;
export const TOTAL_STORES = data.totalStores;
export const MIN_TOTAL_FOR_RANK = data.minTotalForRank;
export const TYPE_COUNT = data.typeCount;

export const GROUPS: Group[] = data.groups.map(([key, emoji, label], i) => ({
  key,
  emoji,
  label,
  natShare: data.groupNatShare[i],
}));

export const groupIndex = (key: string) => GROUPS.findIndex((g) => g.key === key);

export const DONGS: Dong[] = data.dongs.map((r) => {
  const [sido, sigungu] = data.sigungus[r[1]];
  const sidoShort = SIDO_SHORT[sido] ?? sido;
  return {
    code: r[0],
    sido,
    sidoShort,
    sigungu,
    name: r[2],
    total: r[3],
    lat: r[4],
    lon: r[5],
    type: r[6],
    axes: r[7],
    groups: r[8],
    pct: r[9],
    top: r[10],
    rank: r[11],
    evidence: r[12].map((axis) =>
      axis.map(([cat, count, lq, over]) => ({
        category: data.categories[cat],
        count,
        ratio: lq / 10,
        over: over === 1,
      })),
    ),
    hay: normalize(`${sido}${sidoShort}${sigungu}${r[2]}`),
    nameKey: normalize(r[2]),
  };
});

const BY_CODE = new Map(DONGS.map((d) => [d.code, d]));
export const findDong = (code: string | undefined | null) =>
  (code ? BY_CODE.get(code) : undefined) ?? undefined;

export const isReliable = (d: Dong) => d.total >= MIN_TOTAL_FOR_RANK;

/** Human label: "서울 마포구 연남동" */
export const fullName = (d: Dong) => `${d.sidoShort} ${d.sigungu} ${d.name}`;

/** Search by dong / 시군구 / 시도. Supports multiple words: "마포 연남" */
export function searchDongs(query: string, limit = 8): Dong[] {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);
  if (tokens.length === 0) return [];
  const last = tokens[tokens.length - 1];
  const scored: { d: Dong; s: number }[] = [];
  for (const d of DONGS) {
    if (!tokens.every((t) => d.hay.includes(t))) continue;
    let s = 0;
    if (d.nameKey === last) s += 100;
    else if (d.nameKey.startsWith(last)) s += 60;
    else if (d.nameKey.includes(last)) s += 30;
    s += Math.min(20, Math.log10(d.total + 1) * 5); // prefer lively dongs
    scored.push({ d, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.d);
}

/** Nearest dong by store-centroid (good enough for "내 위치로 찾기"). */
export function nearestDong(lat: number, lon: number): Dong {
  let best = DONGS[0];
  let bestD = Infinity;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const d of DONGS) {
    const dx = (d.lon - lon) * k;
    const dy = d.lat - lat;
    const dist = dx * dx + dy * dy;
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best;
}

/** Closest other dong (by store centroid) — "옆 동네" */
export function neighborOf(d: Dong): Dong {
  let best = DONGS[0] === d ? DONGS[1] : DONGS[0];
  let bestD = Infinity;
  const k = Math.cos((d.lat * Math.PI) / 180);
  for (const o of DONGS) {
    if (o.code === d.code || o.total < 50) continue;
    const dx = (o.lon - d.lon) * k;
    const dy = o.lat - d.lat;
    const dist = dx * dx + dy * dy;
    if (dist < bestD) {
      bestD = dist;
      best = o;
    }
  }
  return best;
}

export function randomDong(): Dong {
  const pool = DONGS.filter((d) => d.total >= 300);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Find a dong by name (+ optional 시군구 hint) — used for example chips. */
export function pickByName(name: string, sigunguHint?: string): Dong | undefined {
  const key = normalize(name);
  const cands = DONGS.filter((d) => d.nameKey === key);
  if (sigunguHint) {
    const hint = normalize(sigunguHint);
    const hit = cands.find((d) => normalize(d.sigungu + d.sido).includes(hint));
    if (hit) return hit;
  }
  return cands.sort((a, b) => b.total - a.total)[0];
}

/** share of a group in a dong (0..1) */
export const share = (d: Dong, gi: number) => (d.total ? d.groups[gi] / d.total : 0);

/** ratio vs national share */
export const ratio = (d: Dong, gi: number) => share(d, gi) / GROUPS[gi].natShare;

/** "상위 3%" label from percentile */
export const topPercentLabel = (pctile: number) => {
  const top = Math.max(1, 100 - pctile);
  return `상위 ${top}%`;
};

export const typeCount = (t: string) => TYPE_COUNT[t] ?? 0;

export const fmt = (n: number) => n.toLocaleString("ko-KR");
