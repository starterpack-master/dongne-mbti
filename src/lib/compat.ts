import { DONGS, Dong, isReliable, typeCount } from "./data";

/** 흔히 돌아다니는 "MBTI 궁합표"의 찰떡 조합 (재미용) */
export const BEST: Record<string, string[]> = {
  INFP: ["ENFJ", "ENTJ"],
  ENFP: ["INFJ", "INTJ"],
  INFJ: ["ENFP", "ENTP"],
  ENFJ: ["INFP", "ISFP"],
  INTJ: ["ENFP", "ENTP"],
  ENTJ: ["INFP", "INTP"],
  INTP: ["ENTJ", "ESTJ"],
  ENTP: ["INFJ", "INTJ"],
  ISFP: ["ENFJ", "ESFJ", "ESTJ"],
  ESFP: ["ISFJ", "ISTJ"],
  ISTP: ["ESFJ", "ESTJ"],
  ESTP: ["ISFJ", "ISTJ"],
  ISFJ: ["ESFP", "ESTP"],
  ESFJ: ["ISFP", "ISTP"],
  ISTJ: ["ESFP", "ESTP"],
  ESTJ: ["INTP", "ISFP", "ISTP"],
};

const isNF = (t: string) => t[1] === "N" && t[2] === "F";
const isS = (t: string) => t[1] === "S";

export interface CompatResult {
  score: number;
  tier: "best" | "good" | "ok" | "meh" | "clash" | "twin";
  title: string;
  line: string;
}

export function compat(me: string, dong: string): CompatResult {
  if (me === dong) {
    return {
      score: 84,
      tier: "twin",
      title: "🪞 도플갱어 동네",
      line: "나랑 똑같은 동네! 편하긴 한데 가끔은 지루할지도?",
    };
  }
  const best = BEST[me]?.includes(dong) || BEST[dong]?.includes(me);
  // letter-level chemistry (deterministic)
  let s = 50;
  if (me[1] === dong[1]) s += 12; // 같은 N/S: 대화가 통함
  if (me[2] === dong[2]) s += 8; // 같은 T/F
  if (me[0] !== dong[0]) s += 6; // E/I는 달라야 끌림
  if (me[3] !== dong[3]) s += 4; // J/P도 반대가 매력
  if (best) {
    const score = Math.min(99, 90 + Math.round((s - 50) / 4));
    return {
      score,
      tier: "best",
      title: "💘 찰떡 궁합",
      line: "이 동네 당신 스타일 그 자체. 부동산 앱 켜도 됩니다.",
    };
  }
  if ((isNF(me) && isS(dong)) || (isNF(dong) && isS(me))) {
    const score = 18 + Math.round((s - 50) / 3);
    return {
      score,
      tier: "clash",
      title: "💥 상극 주의",
      line: "서로 너무 달라요. 그래도 여행으로 가끔 가면 신선할지도?",
    };
  }
  if (s >= 70) {
    return { score: s, tier: "good", title: "😊 꽤 잘 맞아요", line: "주말마다 놀러 가기 딱 좋은 궁합." };
  }
  if (s >= 60) {
    return { score: s, tier: "ok", title: "🙂 무난무난", line: "살다 보면 정드는 스타일이에요." };
  }
  return { score: s, tier: "meh", title: "😅 살짝 삐걱", line: "서로 다른 매력을 즐겨 보세요." };
}

/** Round-robin across the best types (biggest first each round) so one type doesn't hog the list. */
function mixTypes(pool: Dong[], types: string[], limit: number): Dong[] {
  const queues = types.map((t) => pool.filter((d) => d.type === t));
  const out: Dong[] = [];
  for (let i = 0; out.length < limit && queues.some((q) => i < q.length); i++) {
    const round = queues.flatMap((q) => (i < q.length ? [q[i]] : [])).sort((a, b) => b.total - a.total);
    out.push(...round.slice(0, limit - out.length));
  }
  return out;
}

/** "나랑 찰떡인 동네": 찰떡 유형 중 가장 그 유형다운 동네들 */
export function bestDongsFor(
  me: string,
  preferSido?: string,
  excludeCode?: string,
  limit = 5,
): { list: Dong[]; scope: string } {
  const bestTypes = BEST[me] ?? [];
  // clearly that type (top 40% most typical), then the liveliest ones people have heard of
  const pool = DONGS.filter(
    (d) =>
      d.code !== excludeCode &&
      isReliable(d) &&
      d.rank > 0 &&
      bestTypes.includes(d.type) &&
      d.rank <= 0.4 * typeCount(d.type),
  ).sort((a, b) => b.total - a.total);
  if (preferSido) {
    const local = pool.filter((d) => d.sido === preferSido);
    if (local.length >= 3) {
      return { list: mixTypes(local, bestTypes, limit), scope: local[0].sidoShort };
    }
  }
  return { list: mixTypes(pool, bestTypes, limit), scope: "전국" };
}
